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

    let userMessage = ref("");
    let chatState = ref("TALKING");
    // 聊天室 UUID
    let chat_room_uuid = ref("INIT");
    let messages = reactive([]);
    let userInfo = reactive({});
    let aiRole = reactive({});
    // 學習範本
    let samples = reactive([
        "關於'Gogoro'的英文學習",
        "關於'我的完美秘書'的韓文學習",
        "關於'NBA'的英文學習",
    ]);

    // 初始化 component
    function init(){
        console.log("learning.init");
        console.log("learning.props.title", props.title);
        console.log("learning.props.account", props.account);
        console.log("learning.props.user_role", props.user_role);

        fetchInitData();
        userMessage.value = "Hi";
        learn();
    }
    // 取得初始資料
    function fetchInitData(){
        // 取得使用者資訊
        let fetchUserInfoPromise = fetchData({
            api: "get_user",
            data: {
                account: props.account,
            }
        });
        Promise.all([fetchUserInfoPromise]).then((values) => {
            console.log("fetchInitData.values=", values);
            userInfo = values[0];
            // ai role 資料
            aiRole = values[0]["ai_role"];
        });
    }
    // learn with ai
    function learn(){
        console.log("learn.message=" + userMessage.value);
        // 關閉全部 modal
        closeAllModal();
        
        chatState.value = "TALKING";
        {
            // 讓 app scroll 到底
            let chatBoxElement = document.getElementById("chatBox");
            chatBoxElement.scrollTop = chatBoxElement.scrollHeight;
        }

        let learnPromise = fetchData({
            api: "learn",
            data: {
                account: props.account,
                chat_room_uuid: chat_room_uuid.value,
                message: userMessage.value,
                time: moment().format("YYYY-MM-DD HH:mm:ss"),
            }
        }, "AI");
        Promise.all([learnPromise]).then((values) => {
            console.log("learnPromise.values=", values);

            chat_room_uuid.value = values[0]["chat_room_uuid"];
            let ai_role = "AI";
            let ai_msg = values[0]["message"];
            let speaker = aiRole["name"];
            let short_name = aiRole["short_name"];

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

        closeAllModal();
        learn();
    }
    // 重傳上一個訊息
    function send_again(re_msg){
        userMessage.value = re_msg;
        send();
    }
    // 開啟 prompt modal
    function openPromptModal(){
        document.getElementById("promptModal").show();
    }
    // 關閉 prompt modal
    function closePromptModal(){
        document.getElementById("promptModal").close();
    }      
    // 複製學習範本
    function copyPrompt(prompt){
        userMessage.value = prompt;
        closePromptModal();
    }
    
    // 關閉全部 modal
    function closeAllModal(){
        closePromptModal();
    }

</script>

<template>

<div class="w-1/1 h-1/1 flex flex-col border rounded-xl p-2 bg-gray-900">

    <!-- function button bar -->
    <div class="w-1/1 shadow-2xl flex flex-col bg-white rounded-xl">
        <div class="w-1/1 flex flex-row">
            <div class="flex-1 p-1">
                <input class="input w-1/1 rounded-xl" v-model="userMessage" placeholder="想學習什麼呢?" :disabled="chatState === 'TALKING'" />
            </div>
            <div class="flex-none p-1 flex flex-row items-center gap-1">
                <a v-if="chatState !== 'TALKING'" class="cursor-pointer text-gray-500 hover:text-gray-900" @click="openPromptModal">
                    <span>
                        <svg class="size-6" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6h8m-8 6h8m-8 6h8M4 16a2 2 0 1 1 3.321 1.5L4 20h5M4 5l2-1v6m-2 0h4"/>
                        </svg>
                    </span>
                </a>
                <a class="cursor-pointer text-gray-500 hover:text-gray-900" @click="send">
                    <span v-if="chatState !== 'TALKING'">
                        <svg class="size-6" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                            <path stroke="currentColor" stroke-linejoin="round" d="m17 13 3.4641-2V7L17 5l-3.4641 2v4M17 13l-3.4641-2M17 13v4l-7.00001 4M17 13V9m0 4-7.00001 4m3.53591-6L10.5 12.7348M9.99999 21l-3.4641-2.1318M9.99999 21v-4m-3.4641 2v-.1318m0 0V15L10.5 12.7348m-3.96411 6.1334L3.5 17V5m0 0L7 3l3.5 2m-7 0 2.99999 2M10.5 5v7.7348M10.5 5 6.49999 7M17 9l3.5-2M17 9l-3.5-2M9.99999 17l-3.5-2m0 .5V7"/>
                        </svg>
                    </span>
                    <span v-if="chatState === 'TALKING'" class="loading loading-spinner loading-md"></span>
                </a>
            </div>
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

<!-- prompt modal -->
<dialog id="promptModal" class="modal modal-end">
    <div class="modal-box h-1/1 w-4/5 flex flex-col bg-neutral-100">
        <div class="flex flex-col justify-center">
            <span class="text-lg text-gray-900 text-center">學習範本</span>
            <div class="divider divider-primary"></div>
        </div>
        <div class="w-1/1 flex flex-col overflow-y-auto gap-2">

            <ul class="list bg-base-100 h-1/1 rounded-box shadow-md">
                <li v-for="(sample, sample_i) in samples" class="list-row">
                    <div class="text-4xl font-thin opacity-30 tabular-nums">
                        {{ ( (sample_i + 1) < 10 ? "0" : "" ) + (sample_i + 1) }}
                    </div>
                    <div class="list-col-grow">
                        <div class="text-lg">{{ sample }}</div>
                    </div>
                    <button class="btn btn-square btn-ghost" title="複製" @click="copyPrompt(sample)">
                        <svg class="size-[1.2em]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g stroke-linejoin="round" stroke-linecap="round" stroke-width="2" fill="none" stroke="currentColor"><path d="M6 3L20 12 6 21 6 3z"></path></g></svg>
                    </button>
                </li>
            </ul>
        </div>

        <div class="divider divider-primary"></div>
        <div class="modal-action flex flex-row justify-center">
            <button class="btn w-1/2 bg-gray-900 text-gray-200 hover:bg-yellow-300 hover:text-gray-900" @click.stop="closePromptModal">
                關閉
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
