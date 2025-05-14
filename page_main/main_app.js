// UI Management
class UI {
    static elements = {
        testButton: document.getElementById('testButton'),
        startButton: document.getElementById('startButton'),
        stopButton: document.getElementById('stopButton'),
        clearButton: document.getElementById('clearButton'),
        voiceSelect: document.getElementById('voiceSelect'),
        transcriptContainer: document.getElementById('transcriptContainer'),
        transcript: document.getElementById('transcript'),
        status: document.getElementById('status'),
        error: document.getElementById('error'),
        imageContainer: document.getElementById('imageContainer'),
        contentWrapper: document.querySelector('.content-wrapper'),
        imageShow: document.getElementById('emoji-placeholder'),
    };

    static updateStatus(message) {
        this.elements.status.textContent = message;
    }

    static showError(message) {
        this.elements.error.style.display = 'block';
        this.elements.error.textContent = message;
    }

    static hideError() {
        this.elements.error.style.display = 'none';
    }

    static updateTranscript(message, type = 'assistant') {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}-message`;
        messageDiv.textContent = message;
        
        if (this.elements.transcript.firstChild) {
            // this.elements.transcript.insertBefore(messageDiv, this.elements.transcript.firstChild);
            this.elements.transcript.appendChild(messageDiv);
        } else {
            this.elements.transcript.appendChild(messageDiv);
        }
        this.elements.transcriptContainer.scrollTop = this.elements.transcriptContainer.scrollHeight;

        // 發送emoji創造訊息
        if (type === "assistant" && app.webrtc) {
            app.webrtc.sendResponseCreate({
                prompt: CONFIG.PROMPTS.emoji_prompt, 
                input: [],
                conversation: "none",
                metadata: { topic: "emoji_show" },
                modalities: ["text"],
            });
        }

        // 將 transcript 傳送給 FastAPI 後端
        // console.log('POSTing to backend:', { message: message, role: type });
        const token = localStorage.getItem("access_token");
        fetch(`${CONFIG.API_ENDPOINTS.message}`, {
            method: 'POST',
            headers: {
                "Authorization": `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message: message, role: type }),
        })
    }

    static clearConversation() {
        this.elements.transcript.innerHTML = '';
        this.elements.imageContainer.innerHTML = '';
        this.elements.contentWrapper.classList.remove('with-image');
        this.hideError();
        this.updateStatus('Ready to start');
        if (map) {
            map.remove();
            map = null;
        }
    }

    static updateButtons(isConnected) {
        this.elements.startButton.disabled = isConnected;
        this.elements.stopButton.disabled = !isConnected;
    }

    static displayImage(imageUrl, imageSource, query) {
        const sideContainer = document.querySelector('.side-container');
        const imageContainer = this.elements.imageContainer;
        
        if (!imageUrl) {
            imageContainer.innerHTML = '';
            this.elements.contentWrapper.classList.remove('with-image');
            // Recenter map after layout changes
            if (map) {
                setTimeout(() => {
                    map.invalidateSize();
                    const center = map.getCenter();
                    map.setView(center, map.getZoom());
                }, 100);
            }
            return;
        }

        this.elements.contentWrapper.classList.add('with-image');
        const imageWrapper = document.createElement('div');
        imageWrapper.className = 'image-wrapper';
        
        const img = document.createElement('img');
        img.className = 'search-image';
        img.alt = query;
        
        const loadingDiv = document.createElement('div');
        loadingDiv.textContent = 'Loading image...';
        loadingDiv.className = 'image-loading';
        imageWrapper.appendChild(loadingDiv);
        
        img.onload = () => {
            loadingDiv.remove();
            imageWrapper.appendChild(img);
            const caption = document.createElement('div');
            caption.className = 'image-caption';
            caption.innerHTML = `
                Image related to: ${query}<br>
                <a href="${imageSource}" target="_blank">Image source</a>
            `;
            imageWrapper.appendChild(caption);
        };
        
        img.onerror = () => {
            loadingDiv.textContent = 'Failed to load image';
            loadingDiv.className = 'image-error';
        };
        
        img.src = imageUrl;
        imageContainer.innerHTML = '';
        imageContainer.appendChild(imageWrapper);
    }

    static updateVoiceSelector(enabled) {
        console.log('Updating voice selector:', !enabled);
        this.elements.voiceSelect.disabled = !enabled;
    }
}

// Error Handler
class ErrorHandler {
    static handle(error, context) {
        console.error(`Error in ${context}:`, error);
        UI.showError(`Error ${context}: ${error.message}`);
    }
}

// Message Handler
class MessageHandler {
    static async handleTranscript(transcript, type = 'assistant') {
        
        if (transcript) {
            UI.updateTranscript(transcript, type);
        }
    }

    static async handleWeatherFunction(output) {
        try {
            const args = JSON.parse(output.arguments);
            const response = await fetch(`${CONFIG.API_ENDPOINTS.weather}/${encodeURIComponent(args.location)}`);
            const data = await response.json();
            
            // Format the current weather information
            const currentWeather = `Current Weather in ${args.location}:
${CONFIG.WEATHER_ICONS[data.weather_code] || '🌡️'} ${data.temperature}°${data.unit_temperature}
• Humidity: ${data.humidity}%
• Precipitation: ${data.precipitation}${data.unit_precipitation}
• Wind Speed: ${data.wind_speed}${data.unit_wind}`.trim();

            // Format the forecast information
            const forecast = data.forecast_daily.map(day => 
                `${new Date(day.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}:
${CONFIG.WEATHER_ICONS[day.weather_code] || '🌡️'} High: ${day.max_temp}°${data.unit_temperature}
• Low: ${day.min_temp}°${data.unit_temperature}
• Precipitation: ${day.precipitation}${data.unit_precipitation}`.trim()
            ).join('\n\n');
            
            const messageDiv = document.createElement('div');
            messageDiv.className = 'message function-result weather';
            
            // Add current weather
            const currentWeatherDiv = document.createElement('div');
            currentWeatherDiv.textContent = currentWeather;
            messageDiv.appendChild(currentWeatherDiv);
            
            // Add forecast toggle button
            const toggleButton = document.createElement('button');
            toggleButton.className = 'forecast-toggle';
            toggleButton.textContent = '7-Day Forecast';
            messageDiv.appendChild(toggleButton);
            
            // Add forecast content (hidden by default)
            const forecastDiv = document.createElement('div');
            forecastDiv.className = 'forecast-content';
            forecastDiv.textContent = forecast;
            messageDiv.appendChild(forecastDiv);
            
            // Add click handler for toggle
            toggleButton.addEventListener('click', () => {
                toggleButton.classList.toggle('expanded');
                forecastDiv.classList.toggle('expanded');
            });
            
            if (UI.elements.transcript.firstChild) {
                // UI.elements.transcript.insertBefore(messageDiv, UI.elements.transcript.firstChild);
                UI.elements.transcript.appendChild(messageDiv);
            } else {
                UI.elements.transcript.appendChild(messageDiv);
            }
            
            if (data.latitude && data.longitude) {
                updateMap(data.latitude, data.longitude, data.location_name);
            }
            UI.elements.transcriptContainer.scrollTop = UI.elements.transcriptContainer.scrollHeight;
            return {
                temperature: data.temperature,
                humidity: data.humidity,
                precipitation: data.precipitation,
                wind_speed: data.wind_speed,
                forecast_daily: data.forecast_daily,
                current_time: data.current_time,
                location: args.location,
                latitude: data.latitude,
                longitude: data.longitude,
                location_name: data.location_name
            };
        } catch (error) {
            ErrorHandler.handle(error, 'Weather Function');
            return "Could not get weather data";
        }
    }

    static async handleSearchFunction(output) {
        try {
            const args = JSON.parse(output.arguments);
            const response = await fetch(`${CONFIG.API_ENDPOINTS.search}/${encodeURIComponent(args.query)}`);
            const data = await response.json();
            console.warn('Search response:', data);
            
            const messageDiv = document.createElement('div');
            messageDiv.className = 'message function-result search';
            
            const titleDiv = document.createElement('div');
            titleDiv.className = 'result-title';
            const titleLink = document.createElement('a');
            titleLink.href = data.source;
            titleLink.target = '_blank';
            titleLink.rel = 'noopener noreferrer';
            titleLink.textContent = data.title;
            titleDiv.appendChild(titleLink);
            
            const snippetDiv = document.createElement('div');
            snippetDiv.className = 'result-snippet';
            snippetDiv.textContent = data.snippet;
            
            const sourceDiv = document.createElement('div');
            sourceDiv.className = 'result-source';
            const sourceLink = document.createElement('a');
            sourceLink.href = data.source;
            sourceLink.target = '_blank';
            sourceLink.rel = 'noopener noreferrer';
            sourceLink.textContent = data.source;
            sourceDiv.appendChild(sourceLink);
            
            messageDiv.appendChild(titleDiv);
            messageDiv.appendChild(snippetDiv);
            messageDiv.appendChild(sourceDiv);
            
            if (UI.elements.transcript.firstChild) {
                // UI.elements.transcript.insertBefore(messageDiv, UI.elements.transcript.firstChild);
                UI.elements.transcript.appendChild(messageDiv);
            } else {
                UI.elements.transcript.appendChild(messageDiv);
            }
            
            UI.displayImage(data.image_url, data.image_source, args.query);
            UI.elements.transcriptContainer.scrollTop = UI.elements.transcriptContainer.scrollHeight;
            
            return {
                title: data.title,
                snippet: data.snippet,
                source: data.source,
                image_url: data.image_url,
                image_source: data.image_source
            };
        } catch (error) {
            ErrorHandler.handle(error, 'Search Function');
            return "Could not perform search";
        }
    }

    static async handleUserDataFunction(output) {
        try {
            const args = JSON.parse(output.arguments);
            const token = localStorage.getItem("access_token");
            const queryResponse = await fetch(`${CONFIG.API_ENDPOINTS.query}`, {
                method: 'POST',
                headers: {
                    "Authorization": `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ query: args.query_description }),
            })
            if (queryResponse.status === 403) {
                alert("⚠️ 您尚未登入或登入已過期，請重新登入");
                window.location.href = `${CONFIG.PAGE_URLS.login}`;
                return;
            }
            const data = await queryResponse.json();
            console.warn("Query", args.query_description, 'Query response:', data);
            // ✅ 這裡先確定 data 是陣列還是單一物件
            const dataArray = Array.isArray(data) ? data : [data];
            const user_search_result = dataArray.map((item, index) => {
                return `📌 分析 #${index + 1}
──────────────
📖 陳述：${item.statement}
🧾 證據：${item.evidence}
🔹 相似度：${(100 / (1 + item.score)).toFixed(1)}%
📁 類別：${item.category} / ${item.subcategory}`;}).join('\n\n');
            console.warn("user_search_result:", user_search_result);
                 
            const messageDiv = document.createElement('div');
            messageDiv.className = 'message function-result user-data';
            
            const titleDiv = document.createElement('div');
            titleDiv.className = 'result-title';
            titleDiv.textContent = args.query_description;
            
            const contentDiv = document.createElement('div');
            contentDiv.className = 'result-content';
            contentDiv.textContent = user_search_result;
            
            messageDiv.appendChild(titleDiv);
            messageDiv.appendChild(contentDiv);
            UI.elements.transcript.appendChild(messageDiv);
            UI.elements.transcriptContainer.scrollTop = UI.elements.transcriptContainer.scrollHeight;


            return data;
        }
        catch (error) {
            ErrorHandler.handle(error, 'User Data Function');
            return "Could not get user data";
        }
    }
}
            

// WebRTC Manager
class WebRTCManager {
    constructor(app) {
        this.peerConnection = null;
        this.audioStream = null;
        this.dataChannel = null;
        this.app = app;  // Store reference to the app
    }
    

    async setupAudio() {
        const audioEl = document.createElement('audio');
        audioEl.autoplay = true;
        this.peerConnection.ontrack = e => audioEl.srcObject = e.streams[0];
        
        this.audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        this.peerConnection.addTrack(this.audioStream.getTracks()[0]);
    }

    setupDataChannel() {
        this.dataChannel = this.peerConnection.createDataChannel('oai-events');
        this.dataChannel.onopen = () => this.onDataChannelOpen();
        this.dataChannel.addEventListener('message', (event) => this.handleMessage(event));
    }

    async handleMessage(event) {
        try {
            const message = JSON.parse(event.data);
            // console.log('Received message:', message);
            // console.log('Received message:', message.type);
            if (message.type === 'response.done') {
                const transcript = message.response?.output?.[0]?.content?.[0]?.transcript;
                if (transcript) {
                    await MessageHandler.handleTranscript(transcript, 'assistant');
                }
                const output = message.response?.output?.[0];
                const metadata = message.response?.metadata;
                // console.log("metadata:", metadata);
                // console.log("message:", message);
                try {
                    if (metadata?.topic === "emoji_show") {
                        const emoji_text = output?.content?.[0]?.text;
                        const emoji = getFirstEmoji(emoji_text);
                        if (emoji) {
                            // console.info("emoji:", emoji, "emoji_text:", emoji_text);
                            UI.elements.imageShow.textContent = emoji;
                        }
                    }
                    if (metadata?.topic === "talk_end"){
                        // console.info("talk_end")
                        const appStopTimer = new Timer(10 * 1000, ()=>{app.stop();});
                        appStopTimer.start();
                    }
                    if (output?.type === 'function_call' && output?.call_id) {
                        let result;
                        if (output.name === 'get_weather') {
                            result = await MessageHandler.handleWeatherFunction(output);
                        } else if (output.name === 'search_web') {
                            result = await MessageHandler.handleSearchFunction(output);
                        }else if (output.name === 'search_user_data') {
                            console.warn('search_user_data_query:', output);
                            result = await MessageHandler.handleUserDataFunction(output);
                        }
                        if (result) {
                            this.sendFunctionOutput(output.call_id, result);
                            this.sendResponseCreate({prompt:""});
                        }
                    }
                } catch (error){
                    ErrorHandler.handle(error, 'Message Processing');
                }
                
                
            }else if (message.type === 'conversation.item.input_audio_transcription.completed') {
                const transcript = message?.transcript;
                if (transcript) {
                    await MessageHandler.handleTranscript(transcript, 'user');
                }
            }else if (message.type === 'input_audio_buffer.speech_started') {
                // console.info('Speech started');
                appTimer.idleTimerStop();
                appTimer.closeTimerStop();
            }else if (message.type === 'output_audio_buffer.stopped') {
                // console.info('Speech stopped');
                appTimer.idleTimerStart();
                appTimer.closeTimerStart();
            }
        } catch (error) {
            ErrorHandler.handle(error, 'Message Processing');
        }
    }

    sendMessage(message) {
        
        if (this.dataChannel?.readyState === 'open') {
            this.dataChannel.send(JSON.stringify(message));
            // console.log('Sent message:', message);
        }else {
            console.error('Data channel is not open. Cannot send message:', message);
        }
    }

    sendSessionUpdate() {
        this.sendMessage({
            type: "session.update",
            session: {
                voice: this.app.currentVoice,
                tools: CONFIG.TOOLS,
                tool_choice: "auto"
            }
        });
    }

    sendInitialMessage() {
        this.sendMessage({
            type: 'conversation.item.create',
            previous_item_id: null,
            item: {
                id: 'msg_' + Date.now(),
                type: 'message',
                role: 'user',
                content: [{
                    type: 'input_text',
                    text: CONFIG.INITIAL_MESSAGE.text
                }]
            }
        });
    }

    sendFunctionOutput(callId, data) {
        this.sendMessage({
            type: 'conversation.item.create',
            item: {
                type: 'function_call_output',
                call_id: callId,
                output: JSON.stringify(data)
            }
        });
    }

    sendResponseCreate({ prompt = null, input = null, conversation = null, metadata = null, modalities = null } = {}) {
        const response_settings = {};
        if (prompt) response_settings.instructions = prompt;
        if (conversation) response_settings.conversation = conversation;
        if (metadata) response_settings.metadata = metadata;
        if (modalities) response_settings.modalities = modalities;
        if (input) response_settings.input = input;
    
        // console.log("response_settings", response_settings);
        this.sendMessage({ 
            type: 'response.create',
            response: response_settings,
        });
    }

    onDataChannelOpen() {
        this.sendSessionUpdate();
        // this.sendInitialMessage();
        this.sendResponseCreate({
            prompt:CONFIG.PROMPTS.start_prompt, 
            conversation:"none",
            metadata:{topic:"talk_start"},
        });
        appTimer.idleTimerStart();
        appTimer.closeTimerStart();    
    }

    cleanup() {
        if (this.peerConnection) {
            this.peerConnection.close();
            this.peerConnection = null;
        }
        if (this.audioStream) {
            this.audioStream.getTracks().forEach(track => track.stop());
            this.audioStream = null;
        }
        if (this.dataChannel) {
            this.dataChannel.close();
            this.dataChannel = null;
        }
    }
}

// Timer callback
class Timer {
    constructor(delay, callback) {
      this.delay = delay;         // 毫秒
      this.callback = callback;
      this.timerId = null;
    }
  
    start() {
      this.cancel(); // 保險起見
      this.timerId = setTimeout(this.callback, this.delay);
    }
  
    cancel() {
      if (this.timerId !== null) {
        clearTimeout(this.timerId);
        this.timerId = null;
      }
    }
}

// Timer for idle and close
class IdleTimer {
    constructor(idleTime, closeTime) {
        this.idleTimeSetting = idleTime*1000; // 1 minute idle
        this.closeTimeSetting = closeTime*1000; // 5 minutes close
        this.idleTimer = null;
        this.closeTimer = null;
        this.isRestCloseTimer = true; // 是否為休息關閉定時器
    }

    idleTimerStart() {
        this.idleTimerStop(); 
        // console.log("Idle Timer Start");
        this.idleTimer = new Timer(this.idleTimeSetting, () => {
            console.log("Idle Timer Triggered");
            this.idleTimerStop();
            app.webrtc.sendResponseCreate({
                prompt: CONFIG.PROMPTS.idle_prompt, 
                conversation: "none",
            });
        });
        this.idleTimer.start();}
    
    closeTimerStart() {
        if (this.isRestCloseTimer) {
            // console.log("Close Timer Start");
            this.isRestCloseTimer = false;
            this.closeTimerStop();
            this.closeTimer = new Timer(this.closeTimeSetting, () => {
                console.log("Close Timer Triggered");
                this.idleTimerStop();
                this.closeTimerStop();
                app.webrtc.sendResponseCreate({
                    prompt: CONFIG.PROMPTS.close_prompt, 
                    conversation: "none",
                    metadata:{topic:"talk_end"},
                });
            });
            this.closeTimer.start();
        }
    }    

    idleTimerStop() {
        if (this.idleTimer) {
            // console.log("Idle Timer Stop");
            this.idleTimer.cancel();
            this.idleTimer = null;
        }
    }
    closeTimerStop() {
        if (this.closeTimer) {
            // console.log("Close Timer Stop");
            this.closeTimer.cancel();
            this.closeTimer = null;
            this.isRestCloseTimer = true;
        }
    }
}        

// Main Application
class App {
    constructor() {
        this.checkSession();
        this.webrtc = null;
        this.currentVoice = CONFIG.VOICE;
        this.bindEvents();
    }

    bindEvents() {
        UI.elements.testButton.style.display = 'none';
        UI.elements.testButton.addEventListener('click', () => this.test());
        UI.elements.startButton.addEventListener('click', () => this.init());
        UI.elements.stopButton.addEventListener('click', () => this.stop());
        UI.elements.clearButton.addEventListener('click', () => UI.clearConversation());
        UI.elements.voiceSelect.addEventListener('change', (e) => {
            if (!this.webrtc) {
                this.currentVoice = e.target.value;
            } else {
                e.target.value = this.currentVoice;
            }
        });
        document.addEventListener('DOMContentLoaded', () => {
            UI.updateStatus('Ready to start');
            UI.elements.voiceSelect.value = this.currentVoice;
        });
    }

    async test() {
        console.log('Testing...');
        const token = localStorage.getItem("access_token");
        const response = await fetch(`${CONFIG.API_ENDPOINTS.stopAndAnalysis}`, {
            headers: {
                "Authorization": `Bearer ${token}`,
            }
        });
    }

    // 在主頁面加上這段檢查
    async checkSession() {
        const token = localStorage.getItem("access_token");
        if (!token) {
            console.log("❌ 沒有 access_token，跳轉登入");
            window.location.href = `${CONFIG.PAGE_URLS.login}`;
            return;
        }

        try {
            const res = await fetch(`${CONFIG.API_ENDPOINTS.sessionJWT}`, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`,
                }
            });
    
            if (!res.ok) {
                console.log("❌ Token 驗證失敗，跳轉登入");
                window.location.href = `${CONFIG.PAGE_URLS.login}`;
            } else {
                console.log("✅ Session 有效");
                // 可加上初始化邏輯
            }
        } catch (err) {
            console.error("❌ Session check error:", err);
            window.location.href = `${CONFIG.PAGE_URLS.login}`;
        }
    }

    async init() {
        console.log('Initializing WebRTC...');
        UI.elements.startButton.disabled = true;
        UI.updateVoiceSelector(false);
       
        
        try {
            UI.updateStatus('Initializing...');
            const token = localStorage.getItem("access_token");
            const tokenResponse = await fetch(`${CONFIG.API_ENDPOINTS.session}?voice=${this.currentVoice}`, {
                method: 'GET',
                headers: {
                    "Authorization": `Bearer ${token}`,
                }
            });
            if (tokenResponse.status === 403) {
                alert("⚠️ 您尚未登入或登入已過期，請重新登入");
                window.location.href = `${CONFIG.PAGE_URLS.login}`;
                return;
            }
            if (!tokenResponse.ok) {
                throw new Error('Could not establish session');
            }

            const data = await tokenResponse.json();
            if (!data.client_secret?.value) {
                throw new Error('Could not establish session');
            }

            const EPHEMERAL_KEY = data.client_secret.value;

            this.webrtc = new WebRTCManager(this);
            this.webrtc.peerConnection = new RTCPeerConnection();
            await this.webrtc.setupAudio();
            this.webrtc.setupDataChannel();

            const offer = await this.webrtc.peerConnection.createOffer();
            await this.webrtc.peerConnection.setLocalDescription(offer);

            const sdpResponse = await fetch(`${CONFIG.API_ENDPOINTS.realtime}?model=${CONFIG.MODEL}`, {
                method: 'POST',
                body: offer.sdp,
                headers: {
                    Authorization: `Bearer ${EPHEMERAL_KEY}`,
                    'Content-Type': 'application/sdp'
                },
            });
            
            if (!sdpResponse.ok) {
                throw new Error('Could not establish connection');
            }

            const sdpText = await sdpResponse.text();
            if (!sdpText) {
                throw new Error('Could not establish connection');
            }

            const answer = {
                type: 'answer',
                sdp: sdpText,
            };
            await this.webrtc.peerConnection.setRemoteDescription(answer);
            

            UI.updateStatus('Connected');
            UI.updateButtons(true);
            UI.hideError();
            

        } catch (error) {
            UI.updateButtons(false);
            UI.updateVoiceSelector(true);
            ErrorHandler.handle(error, 'Initialization');
            UI.updateStatus('Failed to connect');
        }
    }

    async stop() {
        console.warn('Stopping WebRTC...');
        if (this.webrtc) {
            this.webrtc.cleanup();
            this.webrtc = null;
        }
        UI.updateButtons(false);
        UI.updateVoiceSelector(true);
        UI.updateStatus('Ready to start');
        appTimer.idleTimerStop();
        appTimer.closeTimerStop();
        const token = localStorage.getItem("access_token");
        const response = await fetch(`${CONFIG.API_ENDPOINTS.stopAndAnalysis}`, {
            headers: {
                "Authorization": `Bearer ${token}`,
            }
        });
        const data = await response.json();  // ✅ 加上 await

        if (data.status === "success") {
            alert("✅ 分析完成！");
            console.log("✅ 分析完成！");
        } else {
            alert("❌ 分析失敗");
        }
    }
}

let map = null;

function updateMap(latitude, longitude, locationName) {
    if (!map) {
        map = L.map('map').setView([latitude, longitude], 10);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);
    } else {
        map.setView([latitude, longitude], 10);
        map.eachLayer((layer) => {
            if (layer instanceof L.Marker) {
                map.removeLayer(layer);
            }
        });
    }
    
    L.marker([latitude, longitude])
        .addTo(map)
        .bindPopup(locationName)
        .openPopup();

    // Force map to recalculate its container size
    setTimeout(() => {
        map.invalidateSize();
        map.setView([latitude, longitude], 10);
    }, 100);
}

function getFirstEmoji(str) {
    if (typeof str !== 'string') {
        console.warn('getFirstEmoji expects a string but got:', str);
        return null;
    }
    const emojiRegex = /[\p{Emoji_Presentation}\p{Emoji}\uFE0F]/gu;
    const matches = str.match(emojiRegex);
    return matches ? matches[0] : null;
}

// 啟動定時器
const appTimer = new IdleTimer(100, 500); // 1 minute idle, 5 minutes close

// Initialize the application
const app = new App(); 

