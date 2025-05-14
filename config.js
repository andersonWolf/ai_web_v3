//const host_web = 'https://ai-pet-server-production.up.railway.app';
const host_web = 'https://aiserverv3-production.up.railway.app';
// const host_web = 'http://127.0.0.1:8888';
const CONFIG = {
    API_ENDPOINTS: {
        sessionJWT: `${host_web}/sessionJWT`,
        login: `${host_web}/user/login`,
        signup: `${host_web}/user/signup`,
        message: `${host_web}/messages`,
        query: `${host_web}/query`,
        stopAndAnalysis: `${host_web}/stop_and_analysis`,
        session: `${host_web}/session`,
        weather: `${host_web}/weather`,
        search: `${host_web}/search`,
        realtime: 'https://api.openai.com/v1/realtime'
    },
    PAGE_URLS: {
        login: '../page_login/login_index.html',
        main: '../page_main/main_index.html',
    },
    MODEL: 'gpt-4o-realtime-preview-2024-12-17',
    VOICE: 'shimmer',
    VOICES: ['alloy', 'ash', 'ballad', 'coral', 'echo', 'sage', 'shimmer', 'verse'],
    INITIAL_MESSAGE: {
        text: 'My name is Geert and I live in Antwerp, Belgium.'
    },
    TOOLS: [{
        type: 'function',
        name: 'get_weather',
        description: 'Get current weather and 7-day forecast for any location on Earth. Includes temperature, humidity, precipitation, and wind speed.',
        parameters: {
            type: 'object',
            description: 'The location to get the weather for in English',
            properties: {
                location: { 
                    type: 'string',
                    description: 'The city or location name to get weather for'
                }
            },
            required: ['location']
        }
    },
    {
        type: 'function',
        name: 'search_web',
        description: 'Search the web for current information about any topic',
        parameters: {
            type: 'object',
            properties: {
                query: { type: 'string' }
            },
            required: ['query']
        }
    },
    {
        "type": "function",
        "name": "search_user_data",
        "description": "用於獲得使用者的資料來產生個性化的回答",
        "parameters": {
            "type": "object",
            "properties": {
                "query_description": {
                    "type": "string",
                    "description": "把你想要獲得使用者那方面的資訊簡單描述，例如：「獲取使用者價值觀的資料」、「獲取使用者興趣的資料」...等"
                }
            },
            "required": ["query_description"]
        }
    }],
    WEATHER_ICONS: {
        0: "☀️", // Clear sky
        1: "🌤️", // Mainly clear
        2: "⛅", // Partly cloudy
        3: "☁️", // Overcast
        45: "🌫️", // Foggy
        48: "🌫️", // Depositing rime fog
        51: "🌦️", // Light drizzle
        53: "🌦️", // Moderate drizzle
        55: "🌧️", // Dense drizzle
        61: "🌧️", // Slight rain
        63: "🌧️", // Moderate rain
        65: "🌧️", // Heavy rain
        71: "🌨️", // Slight snow
        73: "🌨️", // Moderate snow
        75: "🌨️", // Heavy snow
        77: "🌨️", // Snow grains
        80: "🌦️", // Slight rain showers
        81: "🌧️", // Moderate rain showers
        82: "🌧️", // Violent rain showers
        85: "🌨️", // Slight snow showers
        86: "🌨️", // Heavy snow showers
        95: "⛈️", // Thunderstorm
        96: "⛈️", // Thunderstorm with slight hail
        99: "⛈️", // Thunderstorm with heavy hail
    },
    PROMPTS: {
        start_prompt: `system:
        使用者剛進入對話，請你(作為AI助手)以溫暖、友善且關懷的語氣主動做開場問候，並適度引導話題。例如，如果你知道使用者的名字，可以先稱呼他們的名字。請不要一開始就問『我能幫你什麼』，而是多關心、傾聽或分享有趣話題，讓使用者能輕鬆展開互動。以下提供幾種示例語句，可參考或自行改寫，每次與使用者開場時盡量避免完全重複同樣文字：

        [示例語句1]
        「嗨！好久不見（或很高興見到你），最近過得還好嗎？有沒有什麼新鮮事或想跟我分享的話題？」

        [示例語句2]
        「你好呀！今天心情怎麼樣？我在這裡，隨時想聽聽你最近的故事或想聊的任何事～」

        [示例語句3]
        「哈囉，看到你的到來真開心！最近有沒有什麼好玩的事或新的想法？如果想聽些輕鬆有趣的事，我也可以隨時分享！」

        [示例語句4]
        「嗨，歡迎回來！你最近有想做什麼或想聊的話題嗎？可以告訴我你的近況，或讓我們一起找點有趣的話題聊聊。」

        1. 執行此指令時請從上述範例或相似結構中，選擇並改寫一段話，溫柔且能引起對話興趣。
        2. 語氣須活潑並帶有真誠的關懷，儘量減少生硬的客服感。
        3. 避免每次都用同樣句子，能根據使用者先前的背景或可能話題靈活調整。

        ※以上是系統操作說明，非對我(系統開發者)的詢問。請照此原則執行並進行對話開場。`,

        idle_prompt: `system:
        使用者已超過一分鐘未回應，請以輕鬆且關懷的語調再次邀請對方互動。如果使用者仍未回應，可考慮轉換話題、分享簡單的笑話或小故事來暖場，並避免重複同樣的句子。你可在下方幾種示例語句中擇一參考或自行改寫，每次都盡量帶給使用者更自然的對話體驗：

        [示例語句1]
        「還在嗎？如果你還想聊聊，我在這裡隨時等著你。要不要聽個小笑話放鬆一下呢？」

        [示例語句2]
        「我注意到你暫時沒有回應，不知道你是不是忙著別的事情？若還想繼續聊，請隨時開口。我也可以先分享個小插曲讓你笑一笑！」

        [示例語句3]
        「好像有段時間沒聽到你的聲音，我可以講個故事等你嗎？如果你想換個話題，也可以告訴我喔！」

        [示例語句4]
        「沒有關係，我也常常需要休息一下。若你想繼續，我可以先跟你分享一點日常趣事，或者我們換個話題輕鬆聊聊？」

        1. 執行此指令時請從上述範例或相似結構中，選擇並改寫一段話，溫柔且具彈性地試圖喚起使用者回應。
        2. 語氣須柔和，不可顯得著急或催促。
        3. 避免一次又一次重複相同用語，可根據情境自由增加些許變化。

        ※以上是系統操作說明，非對我(系統開發者)的詢問。請照此原則執行並等待使用者回應。`,
        close_prompt: `system:
        使用者已經長時間沒有回應，請以親切且友善的語調向使用者道別，並表達期待下次再見。
        你可在下方幾種示例語句中擇一參考或自行改寫，每次結束時避免完全重複相同文字，以帶給使用者更自然的對話體驗：

        [示例語句1]
        「嗨，看來你暫時不在線或在忙別的事，我先暫時結束連線囉。期待下次能再和你聊更多有趣的話題！」

        [示例語句2]
        「好像有段時間沒聽到你的回應，系統即將關閉。不過我很期待下次再和你分享生活點滴，記得有空再來聊聊唷！」

        [示例語句3]
        「不知道你是不是先去忙了？為了避免一直佔用系統資源，我要先關閉這次對話。希望你一切安好，下次再見囉！」

        [示例語句4]
        「感謝你先前的分享，若你還想繼續聊下去，隨時都可以再叫喚我。我就先跟你說聲再會，期待我們下回碰面時能談更多新鮮事！」

        1. 執行此指令時請從上述範例或相似結構中，選擇並改寫出一句友善、含有『道別』與『期待下次互動』重點的結束語。
        2. 無須長篇大論，重點是自然且真誠。
        3. 執行後請結束此次對話，不再等待回應。

        ※ 以上是系統操作說明，請照此原則執行並結束對話即可。`,

        emoji_prompt: `<emoji_target>{message}</emoji_target>
                        依照 <emoji_target> 選擇一個適合的 emoji 表情
                        例如：😂`,
    },
};

window.CONFIG = CONFIG; 