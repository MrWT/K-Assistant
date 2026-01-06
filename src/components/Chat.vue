<script setup>
    import { ref, reactive, onMounted, onUpdated, watch, nextTick } from 'vue'
    import moment from 'moment'
    import { gsap } from "gsap"
    import { fetchData } from "@/composables/fetchData"

    const emit = defineEmits(['popupMessage']);
    const props = defineProps({
        title: String,
        account: String,
        user_role: String,
    });

    onMounted(() => {
        console.log("Chat mounted.");
        init();
    });

    onUpdated(() => {
        console.log("Chat updated.");

    });

    let appState = ref("");
    let userMessage = ref("");
    let chatMode = ref("聊天");
    let chatState = ref("TALKING");
    let functionBarStatus = ref("OPEN");
    // 聊天室 UUID
    let chat_room_uuid = ref("INIT");
    let messages = reactive([]);
    let userInfo = reactive({});
    let aiRoles = reactive([]);
    let currentAiRole = reactive({});
    // 提詞機 - 選項
    let promptOptions = reactive({
        nation: [
            { value: "global", text: "國際", },
            { value: "taiwan", text: "台灣", },
            { value: "usa", text: "美國", },
            { value: "japan", text: "日本", },
            { value: "korea", text: "韓國", },
        ],
        scope: [
            { value: "entertainment", text: "演藝圈", },
            { value: "car", text: "汽車", },
            { value: "motorcycle", text: "機車", },
            { value: "stock", text: "股市", },
            { value: "house", text: "房地產", },
            { value: "politic", text: "政治", },
            { value: "basketball", text: "籃球", },
            { value: "baseball", text: "棒球", },
        ],
        time: [
            { value: "today", text: "今天", },
            { value: "24hours", text: "過去24小時", },
            { value: "1week", text: "近一週", },
            { value: "1month", text: "近一個月", },
            { value: "3month", text: "近三個月", },
            { value: "6month", text: "近半年", },
            { value: "1year", text: "近一年", },
        ],
        type: [
            { value: "news", text: "新聞", },
            { value: "sport", text: "賽況", },
            { value: "business", text: "市場", },
        ],
    });
    // 提詞機 - 選擇
    let promptAction = ref("summary");
    let promptNation = ref("taiwan");
    let promptScope = ref("entertainment");
    let promptTime = ref("6month");
    let promptType = ref("news");
    // 提詞機 - 結果
    let prompt = ref("");

    // 初始化 component
    function init(){
        console.log("chat.init");
        console.log("chat.props.title", props.title);
        console.log("chat.props.account", props.account);
        console.log("chat.props.user_role", props.user_role);

        fetchInitData();
        userMessage.value = "Hi";
        chat();

        // 先組合出預設 prompt
        combinePrompt();
    }
    // 取得初始資料
    function fetchInitData(){
        // 取得 AI 角色
        let fetchAIRolesPromise = fetchData({
            api: "get_ai_role",
        }, "AI");
        // 取得使用者資訊
        let fetchUserInfoPromise = fetchData({
            api: "get_user",
            data: {
                account: props.account,
            }
        });
        Promise.all([fetchAIRolesPromise, fetchUserInfoPromise]).then((values) => {
            console.log("fetchInitData.values=", values);
            aiRoles = values[0];
            userInfo = values[1];
        });
    }
    // chat with ai
    function chat(){
        console.log("chat.message=" + userMessage.value);
        // 關閉全部 modal
        closeAllModal();
        
        chatState.value = "TALKING";
        {
            // 讓 app scroll 到底
            let chatBoxElement = document.getElementById("chatBox");
            chatBoxElement.scrollTop = chatBoxElement.scrollHeight;
        }

        let chatPromise = fetchData({
            api: "chat",
            data: {
                account: props.account,
                chat_room_uuid: chat_room_uuid.value,
                message: userMessage.value,
                time: moment().format("YYYY-MM-DD HH:mm:ss"),
            }
        }, "AI");
        Promise.all([chatPromise]).then((values) => {
            console.log("chatPromise.values=", values);

            chat_room_uuid.value = values[0]["chat_room_uuid"];
            let ai_role = "AI";
            let ai_msg = values[0]["message"];
            let speaker = "";
            let short_name = "";
            aiRoles.forEach((roleObj, role_i) => {
                if(roleObj["code"] === values[0]["ai_role"]){
                    speaker = roleObj["name"];
                    short_name = roleObj["short_name"];

                    currentAiRole["speaker"] = roleObj["speaker"];
                    currentAiRole["short_name"] = roleObj["short_name"];
                    currentAiRole["nation"] = roleObj["nation"];
                    currentAiRole["gender"] = roleObj["gender"];
                }
            });

            // AI 出錯了
            if(ai_msg.indexOf("ERROR:") === 0){
                if(ai_msg.indexOf("ERROR:429 RESOURCE_EXHAUSTED") === 0){
                    emit('popupMessage', false, "AI 忙碌中... 請稍等再聊..."); // Emitting the event with data
                    ai_msg = "AI 忙碌中... 請稍等再聊...";
                }else{
                    emit('popupMessage', false, ai_msg); // Emitting the event with data
                }

                ai_role = "AI_ERROR";
                speaker = "ERROR";
                short_name = "E";

            }else{
                // 讓 user 可以直接重傳的機制
                for(let msg_i = messages.length -1; msg_i >= 0; msg_i--){
                    if(messages[msg_i] && messages[msg_i]["role"] === "user"){
                        // AI 正確回覆, 視為"訊息傳遞成功"
                        messages[msg_i]["sent_success"] = true; 
                        break;
                    }
                }
            }

            messages.push({
                role: ai_role,
                speaker: speaker,
                short_name: short_name,
                message: ai_msg,
                time: moment().format("HH:mm:ss"),
            });

            // Vue3 因資料改變 DOM 後觸發
            nextTick(() => {
                chatState.value = "DONE";
                userMessage.value = "";

                // 讓 app scroll 到底
                let chatBoxElement = document.getElementById("chatBox");
                chatBoxElement.scrollTop = chatBoxElement.scrollHeight;
            });
        });
    }
    // translate with ai
    function translate(language, message){
        console.log("translate.language=" + language);
        console.log("translate.message=" + message);

        // 關閉全部 modal
        closeAllModal();
        
        chatState.value = "TALKING";
        {
            // 讓 app scroll 到底
            let chatBoxElement = document.getElementById("chatBox");
            chatBoxElement.scrollTop = chatBoxElement.scrollHeight;
        }

        let translatePromise = fetchData({
            api: "translate",
            data: {
                language: language,
                message: message,
            }
        }, "AI");
        Promise.all([translatePromise]).then((values) => {
            console.log("translatePromise.values=", values);

            let ai_msg = values[0]["message"];
            let ai_role = "AI_TRANSLATE";
            let speaker = "TRANSLATE";
            let short_name = "T";

            // AI 出錯了
            if(ai_msg.indexOf("ERROR:") === 0){
                if(ai_msg.indexOf("ERROR:429 RESOURCE_EXHAUSTED") === 0){
                    emit('popupMessage', false, "AI 忙碌中... 請稍等再聊..."); // Emitting the event with data
                    ai_msg = "AI 忙碌中... 請稍等再聊...";
                }else{
                    emit('popupMessage', false, ai_msg); // Emitting the event with data
                }

                ai_role = "AI_ERROR";
                speaker = "ERROR";
                short_name = "E";

            }else{
                // 讓 user 可以直接重傳的機制
                for(let msg_i = messages.length -1; msg_i >= 0; msg_i--){
                    if(messages[msg_i] && messages[msg_i]["role"] === "user"){
                        // AI 正確回覆, 視為"訊息傳遞成功"
                        messages[msg_i]["sent_success"] = true; 
                        break;
                    }
                }
            }

            messages.push({
                role: ai_role,
                speaker: speaker,
                short_name: short_name,
                message: ai_msg,
                time: moment().format("HH:mm:ss"),
            });

            // Vue3 因資料改變 DOM 後觸發
            nextTick(() => {
                chatState.value = "DONE";
                userMessage.value = "";

                // 讓 app scroll 到底
                let chatBoxElement = document.getElementById("chatBox");
                chatBoxElement.scrollTop = chatBoxElement.scrollHeight;
            });
        });

    }
    // 送出 message
    function send(){
        // 當沒有 keyin message 時, 不送出訊息
        if(!userMessage.value) return;

        let user_name = userInfo.language === "EN" ? userInfo.name : userInfo.cname;

        messages.push({
            role: "user",
            speaker: user_name,
            short_name: props.account.substr(0, 1),
            message: userMessage.value,
            time: moment().format("HH:mm:ss"),
            sent_success: false, // 預設視為"訊息未傳遞成功"
        });

        if(chatMode.value === "聊天"){
            chat();
        }else{
            let language = chatMode.value.substr(2);
            translate(language, userMessage.value);
        }
        // 關閉 function bar
        functionBarStatus.value = "CLOSE";
    }
    // 重傳上一個訊息
    function send_again(re_msg){
        userMessage.value = re_msg;
        send();
    }      
    // 開啟 setting modal
    function openSettingModal(){
        document.getElementById("settingModal").showModal();
    }
    // 關閉 setting modal
    function closeSettingModal(){
        document.getElementById("settingModal").close();
    }
    // 改變 AI 角色
    function changeAiRole(){
        console.log("changeAiRole.currentAiRole=", currentAiRole);
        let msg = "talk_with_";
        switch(currentAiRole.nation){
            case "Korea":
                msg += "kr_";
                break;
            case "Japan":
                msg += "jp_";
                break;
            case "Taiwan":
                msg += "tw_";
                break;
        }
        switch(currentAiRole.gender){
            case "male":
                msg += "boy";
                break;
            case "female":
                msg += "girl";
                break;
        }

        // 清空聊天清單
        messages.splice(0, messages.length);

        userMessage.value = msg;
        chat();
        // 關閉設定 modal
        closeSettingModal();
    }
    // 開啟 prompt modal
    function openPromptModal(){
        document.getElementById("promptModal").showModal();
    }
    // 組合提詞
    function combinePrompt(){
        let c_prompt = "整理出";
        /*
        console.log("combinePrompt.promptNation=", promptNation.value);
        console.log("combinePrompt.promptScope=", promptScope.value);
        console.log("combinePrompt.promptTime=", promptTime.value);
        console.log("combinePrompt.promptType=", promptType.value);
        */
        if(promptTime.value){
            promptOptions.time.forEach((timeObj, act_i) => {
                if(promptTime.value === timeObj.value){
                    let today = moment().format("YYYY-MM-DD");
                    let stDate = "";

                    switch(promptTime.value){
                        case "today": stDate = today; break;
                        case "24hours": stDate = moment().add(-1, "d").format("YYYY-MM-DD"); break;
                        case "1week": stDate = moment().add(-7, "d").format("YYYY-MM-DD"); break;
                        case "1month": stDate = moment().add(-1, "M").format("YYYY-MM-DD"); break;
                        case "3month": stDate = moment().add(-3, "M").format("YYYY-MM-DD"); break;
                        case "6month": stDate = moment().add(-6, "M").format("YYYY-MM-DD"); break;
                        case "1year": stDate = moment().add(-12, "M").format("YYYY-MM-DD"); break;
                    }
                    c_prompt += " " + stDate + "~" + today + " ";
                }
            });
        }

        if(promptNation.value){
            promptOptions.nation.forEach((nationObj, act_i) => {
                if(promptNation.value === nationObj.value){
                    c_prompt += nationObj.text;
                }
            });
        }

        if(promptScope.value){
            promptOptions.scope.forEach((scopeObj, act_i) => {
                if(promptScope.value === scopeObj.value){
                    c_prompt += scopeObj.text;
                }
            });
        }

        if(promptType.value){
            promptOptions.type.forEach((typeObj, act_i) => {
                if(promptType.value === typeObj.value){
                    c_prompt += typeObj.text;
                }
            });
        }

        prompt.value = c_prompt;
    }
    // 傳送提詞
    function sendPrompt(){
        if(prompt.value){
            chat_room_uuid.value = "INIT";
            userMessage.value = prompt.value;
            send();
        }else{
            let error_msg = "你必須提供點內容, 不然提詞機要怎麼幫你轉送~~";
            emit('popupMessage', false, error_msg); // Emitting the event with data
        }
        closePromptModal();
    }
    // 關閉 prompt modal
    function closePromptModal(){
        document.getElementById("promptModal").close();
    }
    // 開啟 NewChat 再確認 modal
    function openNewChatConfirmModal(){
        document.getElementById("newChatConfirmModal").showModal();
    }
    // 開新話題
    function newChat(){
        console.log("newChat");
        // 關閉再確認 modal
        closeNewChatConfirmModal();
        // 清空對話錄
        messages.splice(0, messages.length);
        chat_room_uuid.value = "INIT";
        // 開啟新對話
        userMessage.value = "Hi";
        chat();
    }
    // 關閉 NewChat 再確認 modal
    function closeNewChatConfirmModal(){
        document.getElementById("newChatConfirmModal").close();
    }
    // 關閉全部 modal
    function closeAllModal(){
        closeNewChatConfirmModal();
        closePromptModal();
        closeSettingModal();
    }
    // 開啟/關閉 function bar
    function toggleFunctionBar(){
        functionBarStatus.value = functionBarStatus.value === "OPEN" ? "CLOSE" : "OPEN"; 
    }

    // 監聽
    watch(promptAction, (newValue, oldValue) => {
        combinePrompt();
    });
    watch(promptNation, (newValue, oldValue) => {
        combinePrompt();
    });
    watch(promptScope, (newValue, oldValue) => {
        combinePrompt();
    });
    watch(promptTime, (newValue, oldValue) => {
        combinePrompt();
    });
    watch(promptType, (newValue, oldValue) => {
        combinePrompt();
    });
    watch(chatMode, (newValue, oldValue) => {
        console.log("watch.chatMode.newValue=" + newValue);

        if(newValue === "聊天"){
            newChat();
        }else{
            // 關閉再確認 modal
            closeNewChatConfirmModal();
            // 清空對話錄
            messages.splice(0, messages.length);
        }
    });

</script>

<template>

<div class="w-1/1 h-1/1 flex flex-col border rounded-xl p-2 bg-gray-900">

    <!-- function button bar -->
    <div class="w-1/1 shadow-2xl flex flex-col bg-white rounded-xl">
        <div class="w-1/1 flex flex-row gap-1 p-1 items-center">
            <div class="flex-1 flex flex-row gap-1 p-1 overflow-x-auto items-center">
                <label>
                    模式:
                </label>
                <label>
                    <input type="radio" value="聊天" v-model="chatMode" />
                    聊天
                </label>
                <label>
                    <input type="radio" value="翻譯日文" v-model="chatMode" />
                    翻譯日文
                </label>
                <label>
                    <input type="radio" value="翻譯韓文" v-model="chatMode" />
                    翻譯韓文
                </label>
            </div>
            <div class="flex-none items-center">
                <a class="cursor-pointer text-gray-500 hover:text-gray-900" @click="toggleFunctionBar">
                    <svg v-if="functionBarStatus === 'OPEN'" class="size-6" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                        <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m5 15 7-7 7 7"/>
                    </svg>
                    <svg v-if="functionBarStatus === 'CLOSE'" class="size-6" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                        <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m19 9-7 7-7-7"/>
                    </svg>
                </a>
            </div>
        </div>
        <div v-if="functionBarStatus === 'OPEN'" class="w-1/1 flex flex-row">
            <div class="flex-1 p-1">
                <textarea class="textarea w-1/1 h-1/1 rounded-xl" v-model="userMessage" placeholder="想說點什麼呢?" :disabled="chatState === 'TALKING'"></textarea>
            </div>
            <div class="flex-none p-1 flex-col w-1/4 min-w-10 max-w-30 h-1/1 gap-1">
                <button class="btn bg-blue-500/50 text-gray-900 hover:bg-gray-900 hover:text-gray-100 rounded-xl w-1/1 h-1/1" @click="send">
                    <span v-if="chatState !== 'TALKING' && chatMode === '聊天'">傳送</span>
                    <span v-if="chatState !== 'TALKING' && chatMode !== '聊天'">翻譯</span>
                    <span v-if="chatState === 'TALKING'" class="loading loading-spinner loading-md"></span>
                </button>
            </div>
        </div>
        <div v-if="chatMode === '聊天' && functionBarStatus === 'OPEN'" class="w-1/1 flex flex-row gap-1 p-1 overflow-x-auto">
            <button class="btn rounded-xl bg-red-300 text-gray-900 hover:bg-blue-300" @click="openNewChatConfirmModal">
                新對話
            </button>
            <button class="btn rounded-xl bg-gray-300 hover:bg-blue-300" @click="openSettingModal">
                AI 角色
            </button>
            <button class="btn rounded-xl bg-gray-900 text-white hover:bg-blue-300 hover:text-black" @click="openPromptModal">
                提詞機
            </button>
        </div>
    </div>

    <!-- 聊天內容 -->
    <div id="chatBox" class="flex flex-col w-1/1 h-11/12 overflow-y-auto">
        <div v-for="(msgObj, msg_i) in messages" class="chat"
            :class="{ 'chat-start': msgObj.role === 'AI' || msgObj.role === 'AI_ERROR' || msgObj.role === 'AI_TRANSLATE', 'chat-end': msgObj.role === 'user' }">
            <div class="chat-image avatar">
                <div class="avatar avatar-placeholder">
                    <div class="w-8 rounded-full border-5 bg-white text-gray-900"
                        :class="{'border-rose-300': msgObj.role === 'AI', 'border-red-900': msgObj.role === 'AI_ERROR', 'border-blue-900': msgObj.role === 'AI_TRANSLATE', 'border-lime-300': msgObj.role === 'user'}">
                        <span class="text-xs">{{ msgObj.short_name }}</span>
                    </div>
                </div>
            </div>
            <div class="chat-header text-white">
                {{ msgObj.speaker }}
                <time class="text-xs opacity-70">{{ msgObj.time }}</time>
            </div>
            <div class="chat-bubble  flex flex-row items-center">
                <!-- 訊息傳遞中 -->
                <a v-if="msgObj.role === 'user' && chatState === 'TALKING'">
                    <span class="loading loading-ring loading-xs"></span>
                </a>
                <!-- 訊息傳遞失敗, 而且是 user 最新訊息 -->
                <a v-if="msgObj.role === 'user' && chatState !== 'TALKING' && msgObj.sent_success === false && msg_i === (messages.length -2)" title="重傳" @click="send_again(msgObj.message)">
                    <svg class="size-4 text-red-900 hover:cursor-pointer" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                        <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 9H8a5 5 0 0 0 0 10h9m4-10-4-4m4 4-4 4"/>
                    </svg>
                </a>
                <!-- 訊息傳遞失敗, 而且不是 user 最新訊息 -->
                <a v-if="msgObj.role === 'user' && chatState !== 'TALKING' && msgObj.sent_success === false && msg_i < (messages.length -2)">
                    <svg class="size-4 text-red-900" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                        <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18 17.94 6M18 18 6.06 6"/>
                    </svg>
                </a>
                <!-- 訊息傳遞成功 -->
                <a v-if="msgObj.role === 'user' && chatState !== 'TALKING' && msgObj.sent_success === true">
                    <svg class="size-4 text-lime-900" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                        <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 11.917 9.724 16.5 19 7.5"/>
                    </svg>
                </a>
                <p style="white-space:pre-wrap;">
                    {{ msgObj.message }}
                </p>
            </div>
        </div>
        <div v-if="chatState === 'TALKING'" class="chat chat-start">
            <div class="chat-image avatar">
                <div class="avatar avatar-placeholder">
                    <div class="size-8 rounded-full border-5 border-yellow-300 bg-white text-gray-900">
                        <span class="text-xs">
                            {{ "AI" }}
                        </span>
                    </div>
                </div>
            </div>
            <div class="chat-header text-white">
                {{ "AI" }}
            </div>
            <div class="chat-bubble">
                好喔~ 稍等
                <span class="loading loading-dots loading-xs"></span>
            </div>
        </div>
    </div>
</div>


<!-- setting modal -->
<dialog id="settingModal" class="modal modal-end">
    <div class="modal-box h-7/10 w-8/10 flex flex-col bg-neutral-100">
        <div class="flex flex-col justify-center">
            <span class="text-xl text-gray-900 text-center">AI 角色設定</span>
            <div class="divider divider-primary"></div>
        </div>
        <div class="h-8/10 w-10/10 flex flex-col overflow-y-auto">
            <div class="text-gray-900 text-center">
                國家:
            </div>
            <div class="flex flex-row justify-center gap-2">            
                <label class="label text-gray-900 ">
                    <input type="radio" class="radio radio-primary" value="Korea" v-model="currentAiRole.nation" />
                    韓國 
                </label>
                <label class="label text-gray-900">
                    <input type="radio" class="radio radio-primary" value="Japan" v-model="currentAiRole.nation" />
                    日本
                </label>
                <label class="label text-gray-900">
                    <input type="radio" class="radio radio-primary" value="Taiwan" v-model="currentAiRole.nation" />
                    台灣
                </label>
            </div>
            <div class="divider"></div>
            <div class="text-gray-900 text-center">
                性別:
            </div>
            <div class="flex flex-row justify-center gap-2">
                <label class="label text-gray-900">
                    <input type="radio" class="radio radio-secondary" value="male" v-model="currentAiRole.gender" />
                    Boy
                </label>
                <label class="label text-gray-900">
                    <input type="radio" class="radio radio-secondary" value="female" v-model="currentAiRole.gender" />
                    Girl
                </label>
            </div>
        </div>
        <div class="divider divider-primary"></div>
        <div class="modal-action px-10">
            <button class="btn w-1/2 bg-gray-900 text-gray-200 hover:bg-yellow-300 hover:text-gray-900" @click="closeSettingModal">
                關閉
            </button>

            <button class="btn w-1/2 bg-gray-200 text-gray-900 hover:bg-yellow-300" @click="changeAiRole">
                儲存
            </button>
        </div>
    </div>
    <form method="dialog" class="modal-backdrop">
        <button>close</button>
    </form>
</dialog>

<!-- prompt modal -->
<dialog id="promptModal" class="modal modal-end">
    <div class="modal-box h-10/10 max-w-10/10 flex flex-col bg-neutral-100">
        <div class="flex flex-col justify-center">
            <span class="text-lg text-gray-900 text-center">聊天提詞機</span>
            <div class="divider divider-primary"></div>
        </div>
        <div class="h-3/4 md:h-4/5 w-1/1 flex flex-col overflow-y-auto gap-2 border rounded-2xl">
            <div class="h-1/3 w-1/1 flex flex-row rounded-lg bg-state-200 px-2 gap-1 overflow-x-auto">
                <label v-for="(nObj, n_i) in promptOptions.nation" class="label text-gray-900">
                    <input type="radio" class="radio" :value="nObj.value" v-model="promptNation" />
                    {{ nObj.text }}
                </label>
            </div>
            <div class="h-1/3 w-1/1 flex flex-row rounded-lg bg-stone-200 px-2 gap-1 overflow-x-auto">
                <label v-for="(sObj, s_i) in promptOptions.scope" class="label text-gray-900">
                    <input type="radio" class="radio" :value="sObj.value" v-model="promptScope" />
                    {{ sObj.text }}
                </label>
            </div>
            <div class="h-1/3 w-1/1 flex flex-row rounded-lg bg-state-200 px-2 gap-1 overflow-x-auto">
                <label v-for="(tObj, t_i) in promptOptions.time" class="label text-gray-900">
                    <input type="radio" class="radio" :value="tObj.value" v-model="promptTime" />
                    {{ tObj.text }}
                </label>
            </div>
            <div class="h-1/3 w-1/1 flex flex-row rounded-lg bg-stone-200 px-2 gap-1 overflow-x-auto">
                <label v-for="(tObj, t_i) in promptOptions.type" class="label text-gray-900">
                    <input type="radio" class="radio" :value="tObj.value" v-model="promptType" />
                    {{ tObj.text }}
                </label>
            </div>
        </div>

        <textarea class="textarea h-1/4 md:h-1/5 w-1/1 mt-1 bg-gray-900 text-gray-100" placeholder="想說點什麼嗎??" v-model="prompt"></textarea>

        <div class="divider divider-primary"></div>
        <div class="modal-action px-10">
            <button class="btn w-1/2 bg-gray-900 text-gray-200 hover:bg-yellow-300 hover:text-gray-900" @click.stop="closePromptModal">
                關閉
            </button>

            <button class="btn w-1/2 bg-gray-200 text-gray-900 hover:bg-yellow-300" @click.stop="sendPrompt">
                傳送
            </button>
        </div>
    </div>
    <form method="dialog" class="modal-backdrop">
        <button>close</button>
    </form>
</dialog>

<!-- newChatConfirm modal -->
<dialog id="newChatConfirmModal" class="modal">
    <div class="modal-box h-3/10 w-1/1 flex flex-col bg-neutral-500">
        <div class="w-1/1 text-center text-black font-black bg-white rounded-xl">
            <span class="text-2xl">再跟您確認一次~</span>
        </div>

        <div class="divider divider-primary"></div>
        <div class="modal-action px-10">
            <button class="btn w-1/2 text-gray-200 bg-gray-900 hover:bg-yellow-200 hover:text-gray-900" @click="closeNewChatConfirmModal">
                話題繼續
            </button>

            <button class="btn w-1/2 text-gray-900 bg-rose-200 hover:bg-yellow-200 hover:text-gray-900" @click="newChat">
                新話題
            </button>
        </div>
    </div>
    <form method="dialog" class="modal-backdrop">
        <button>close</button>
    </form>
</dialog>


</template>

<style scoped>

</style>
