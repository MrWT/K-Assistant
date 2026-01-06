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
    })

    onMounted(() => {
        console.log("QA mounted.");
        init();
    });

    onUpdated(() => {
        console.log("QA updated.");

    });

    let appState = ref("");
    let userMessage = ref("");
    let chatState = ref("TALKING");
    // 聊天室 UUID
    let chat_room_uuid = ref("INIT");
    let messages = reactive([]);
    let userInfo = reactive({});
    let aiRoles = reactive([]);
    let currentAiRole = reactive({});
    // 預設 prompt option
    let definedOptions = reactive([
        "基金會在哪成立?",
        "基金會目前的管理人是誰?",
        "提供輪值代管人的資訊",
        "帳務明細的檔案是?",
        "帳務管理的銀行帳號是?",
        "有哪些月費儲值方式?",
        "每月儲值截止日期是?",
        "每月月費多少?",
        "列出活動規劃",
    ]);
    let definedPrompt = ref("基金會在哪成立?");

    // 初始化 component
    function init(){
        console.log("QA.init");
        console.log("QA.props.title", props.title);
        console.log("QA.props.account", props.account);
        console.log("QA.props.user_role", props.user_role);

        fetchInitData();
        userMessage.value = "Hi";
        chat();
    }
    // 取得初始資料
    function fetchInitData(){
        // 取得 AI 角色
        let fetchPromise_aiRoles = fetchData({
            api: "get_ai_role",
        }, "AI");
        // 取得使用者資訊
        let fetchPromise_userInfo = fetchData({
            api: "get_user",
            data: {
                account: props.account,
            }
        });
        Promise.all([fetchPromise_aiRoles, fetchPromise_userInfo]).then((values) => {
            console.log("fetchInitData.values=", values);
            aiRoles = values[0];
            userInfo = values[1];
        });
    }
    // chat with ai
    function chat(){
        console.log("chat.message=" + userMessage.value);
        
        chatState.value = "TALKING";
        {
            // 讓 app scroll 到底
            let chatBoxElement = document.getElementById("chatBox");
            chatBoxElement.scrollTop = chatBoxElement.scrollHeight;
        }

        let chatPromise = fetchData({
            api: "qa",
            data: {
                account: props.account,
                chat_room_uuid: chat_room_uuid.value,
                message: userMessage.value,
                time: moment().format("YYYY-MM-DD HH:mm:ss"),
            }
        }, "KUO-FUNDS");
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
        console.log("send.userMessage.value=" + userMessage.value);

        // 當沒有 keyin message 時, 不送出訊息
        if(!userMessage.value) return;

        let user_name = userInfo.language === "EN" ? userInfo.name : userInfo.cname;

        messages.push({
            role: "user",
            speaker: user_name,
            short_name: props.account.substr(0, 1),
            message: userMessage.value,
            time: moment().format("HH:mm:ss"),
        });

        chat();
    }      
    // 開啟 prompt modal
    function openPromptModal(){
        document.getElementById("promptModal").showModal();
    }
        // 傳送提詞
    function sendPrompt(){
        if(definedPrompt.value){
            chat_room_uuid.value = "INIT";
            userMessage.value = definedPrompt.value;
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


</script>

<template>

<div class="w-1/1 h-1/1 flex flex-col border rounded-xl p-2 bg-gray-900">

    <!-- function button bar -->
    <div class="w-1/1 shadow-2xl flex flex-col bg-white rounded-xl">
        <div class="w-1/1 flex flex-row">
            <div class="flex-1 p-2">
                <textarea class="textarea w-1/1 h-1/1 rounded-xl" v-model="userMessage" placeholder="想說點什麼呢?" :disabled="chatState === 'TALKING'"></textarea>
            </div>
            <div class="flex-none p-1 flex-col w-1/4 min-w-10 max-w-30 h-1/1 gap-1">
                <button class="btn bg-blue-500/50 text-gray-900 hover:bg-gray-900 hover:text-gray-100 rounded-xl w-1/1 h-1/1" @click="send">
                    <span v-if="chatState !== 'TALKING'">傳送</span>
                    <span v-if="chatState === 'TALKING'" class="loading loading-spinner loading-md"></span>
                </button>
            </div>
        </div>
        <div class="w-1/1 flex flex-row gap-1 p-1 overflow-x-auto">
            <button class="btn rounded-xl bg-gray-900 text-white hover:bg-blue-300 hover:text-black" @click="openPromptModal">
                提詞機
            </button>
        </div>
    </div>

    <!-- 聊天內容 -->
    <div id="chatBox" class="flex flex-col w-1/1 h-11/12 overflow-y-auto">
        
        <div v-for="(msgObj, msg_i) in messages" class="chat"
            :class="{ 'chat-start': msgObj.role === 'AI' || msgObj.role === 'AI_ERROR', 'chat-end': msgObj.role === 'user' }">
            <div class="chat-image avatar">
                <div class="avatar avatar-placeholder">
                    <div class="w-8 rounded-full border-5 bg-white text-gray-900"
                        :class="{'border-rose-300': msgObj.role === 'AI', 'border-red-900': msgObj.role === 'AI_ERROR', 'border-lime-300': msgObj.role === 'user'}">
                        <span class="text-xs">{{ msgObj.short_name }}</span>
                    </div>
                </div>
            </div>
            <div class="chat-header text-white">
                {{ msgObj.speaker }}
                <time class="text-xs opacity-70">{{ msgObj.time }}</time>
            </div>
            <div class="chat-bubble">
                <p style="white-space:pre-wrap;">
                    {{ msgObj.message }}
                </p>
            </div>
        </div>
        <div v-if="chatState === 'TALKING'" class="chat chat-start">
            <div class="chat-image avatar">
                <div class="avatar avatar-placeholder">
                    <div class="size-8 rounded-full bg-gray-100 text-gray-900 border-5 border-yellow-500">
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
    <div class="modal-box h-4/5 w-4/5 flex flex-col bg-neutral-100">
        <div class="flex flex-col justify-center">
            <span class="text-lg text-gray-900 text-center">聊天提詞機</span>
            <div class="divider divider-primary"></div>
        </div>
        <div class="h-3/4 md:h-4/5 w-1/1 flex flex-col overflow-y-auto gap-2 border rounded-2xl">
            <label v-for="(option, option_i) in definedOptions">
                <input type="radio" v-model="definedPrompt" :value="option" />
                {{ option }}
            </label>
        </div>

        <div class="divider divider-primary"></div>
        <div class="modal-action">
            <button class="btn btn-ghost w-1/2 bg-gray-900 text-gray-100 hover:bg-yellow-200 hover:text-black" @click.stop="closePromptModal">
                關閉
            </button>

            <button class="btn btn-ghost w-1/2 bg-gray-200 text-black hover:bg-yellow-200" @click.stop="sendPrompt">
                傳送
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
