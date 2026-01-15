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
        console.log("FitnessCoach mounted.");
        init();
    });

    onUpdated(() => {
        console.log("FitnessCoach updated.");

    });

    let appState = ref("");
    let userMessage = ref("");
    let chatMode = ref("聊天");
    let chatState = ref("TALKING");
    // 聊天室 UUID
    let chat_room_uuid = ref("INIT");
    let messages = reactive([]);
    let userInfo = reactive({});
    let aiRole = reactive({});

    let planName = ref("");

    // 初始化 component
    function init(){
        console.log("FitnessCoach.init");
        console.log("FitnessCoach.props.title", props.title);
        console.log("FitnessCoach.props.account", props.account);
        console.log("FitnessCoach.props.user_role", props.user_role);

        fetchInitData();
        userMessage.value = "Hi";
        chat();
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
            aiRole = values[0]["ai_role"];
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
            api: "coach",
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
    // 統整訓練計畫
    function sumupPlan(){
        // 關閉全部 Modal
        closeAllModal();

        // 整理聊天內容成"json"
        let sumupPromise = fetchData({
            api: "sumup_plan",
            data: {
                account: props.account,
                chat_room_uuid: chat_room_uuid.value,
                message: "",
                time: moment().format("YYYY-MM-DD HH:mm:ss"),
            }
        }, "AI");
        Promise.all([sumupPromise]).then((values) => {
            console.log("sumupPromise.values=", values);

            let ai_msg = values[0]["message"];
            ai_msg = ai_msg.replace(/```/g, "").replace(/json/g, "").replace(/\n/g, "").trim();
            //console.log("ai_msg=", ai_msg);
            let planList = JSON.parse(ai_msg);
            console.log("planList=", planList);

            // 新增訓練菜單
            newFitnessPlan(planList);
        });
    }
    // 新增訓練菜單
    function newFitnessPlan(planList){
        console.log("newFitnessPlan.planList=", planList);

        let purposes = [];
        planList.forEach((planObj, m_i) => {
            purposes.push( planObj["purpose"] );
        });

        let newPlanPromise = fetchData({
            api: "new_fitness_plan",
            data: {
                account: props.account,
                purposes: purposes,
                plan_name: planName.value,
            }
        });
        Promise.all([newPlanPromise]).then((values) => {
            console.log("newPlanPromise.values=", values);
            let plan_no = values[0]["message"].split("=")[1];

            // 新增訓練菜單-細項
            let promiseList_newItem = [];
            planList.forEach((planObj, m_i) => {
                planObj["item"].forEach((miObj, mi_i) => {
                    let planItemObj = {
                        plan_no: plan_no,
                        day_seq: m_i,
                        item_seq: mi_i,
                        name: miObj["name"],
                        frequency: miObj["frequency"],
                        purpose: miObj["purpose"],
                    };
                    promiseList_newItem.push( newFitnessPlanItem(planItemObj) );
                });
            });
            Promise.all(promiseList_newItem).then((values_item) => {
                console.log("promiseList_newItem.values_item=", values_item);


            });
        });
    }
    // 新增訓練菜單-細項
    function newFitnessPlanItem(planItemObj){
        let newPlanItemPromise = fetchData({
            api: "new_fitness_plan_item",
            data: planItemObj
        });
        return newPlanItemPromise;
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
    }
    // 重傳上一個訊息
    function send_again(re_msg){
        userMessage.value = re_msg;
        send();
    }      
    // 開啟 NewChat 再確認 modal
    function openNewChatConfirmModal(){
        document.getElementById("newChatConfirmModal").showModal();
    }
    // 開新話題
    function newChat(){
        console.log("newChat");
        // 關閉再確認 modal
        closeModal_newChatConfirmModal();
        // 清空對話錄
        messages.splice(0, messages.length);
        chat_room_uuid.value = "INIT";
        // 開啟新對話
        userMessage.value = "Hi";
        chat();
    }
    // 關閉 NewChat 再確認 modal
    function closeModal_newChatConfirmModal(){
        document.getElementById("newChatConfirmModal").close();
    }
    // 開啟 namePlanModal
    function openModal_namePlanModal(){
        planName.value = "";
        document.getElementById("namePlanModal").showModal();
    }
    // 為 plan 命名
    function namePlan(){
        sumupPlan();
    }
    // 關閉 namePlanModal
    function closeModal_namePlanModal(){
        document.getElementById("namePlanModal").close();
    }
    // 關閉全部 modal
    function closeAllModal(){
        closeModal_newChatConfirmModal();
        closeModal_namePlanModal();
    }

    // 監聽
    watch(chatMode, (newValue, oldValue) => {
        console.log("watch.chatMode.newValue=" + newValue);

        if(newValue === "聊天"){
            newChat();
        }else{
            // 關閉再確認 modal
            closeModal_newChatConfirmModal();
            // 清空對話錄
            messages.splice(0, messages.length);
        }
    });

</script>

<template>

<div class="w-1/1 h-1/1 flex flex-col border rounded-xl p-2 bg-gray-900">

    <!-- function button bar -->
    <div class="w-1/1 shadow-2xl flex flex-col bg-white rounded-xl">
        <div class="w-1/1 flex flex-row">
            <div v-if="chatState !== 'TALKING'" class="flex-none p-1 flex flex-row gap-2">
                <!-- 新話題 -->
                <a title="新話題" class="cursor-pointer p-1 bg-rose-500/50 text-gray-500 hover:text-gray-900 rounded-xl flex place-items-center" @click="openNewChatConfirmModal">
                    <svg class="size-6" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                        <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 7.757v8.486M7.757 12h8.486M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
                    </svg>
                </a>
            </div>
            <div class="flex-1 p-1">
                <input v-if="userMessage.length <= 50" type="text" class="input w-1/1 h-1/1 rounded-xl border" v-model="userMessage" placeholder="想說點什麼呢?" :disabled="chatState === 'TALKING'" />
                <textarea v-if="userMessage.length > 50" class="textarea w-1/1 h-1/1 rounded-xl border" v-model="userMessage" placeholder="想說點什麼呢?" :disabled="chatState === 'TALKING'"></textarea>
            </div>
            <div class="flex-none p-1 flex flex-row gap-1">
                <!-- 統整 -->
                <a v-if="chatState !== 'TALKING'" title="統整" class="cursor-pointer p-1 bg-blue-500/50 text-gray-500 hover:text-gray-900 rounded-xl flex place-items-center" @click="openModal_namePlanModal">
                    <svg class="size-6" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                        <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 11v5m0 0 2-2m-2 2-2-2M3 6v1a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1Zm2 2v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8H5Z"/>
                    </svg>
                </a>

                <!-- 傳送 -->
                <a title="傳送" class="cursor-pointer p-1 bg-blue-500/50 text-gray-500 hover:text-gray-900 rounded-xl flex place-items-center" @click="send">
                    <span v-if="chatState === 'TALKING'" class="loading loading-spinner loading-md"></span>
                    <svg v-if="chatState !== 'TALKING'" class="size-6 rotate-90" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                        <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m12 18-7 3 7-18 7 18-7-3Zm0 0v-5"/>
                    </svg>            
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
            <div class="chat-bubble  flex flex-row items-center gap-2">
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
        <div v-if="chatState === 'TALKING'" class="w-1/1 text-center mt-5">
            <span class="skeleton skeleton-text text-xl text-white">
                AI is thinking harder
                <span class="loading loading-ring loading-xl"></span>
            </span>
        </div>
    </div>
</div>


<!-- newChatConfirm modal -->
<dialog id="newChatConfirmModal" class="modal">
    <div class="modal-box h-3/10 w-1/1 flex flex-col bg-neutral-500">
        <div class="w-1/1 text-center text-black font-black bg-white rounded-xl">
            <span class="text-2xl">再跟您確認一次~</span>
        </div>

        <div class="divider divider-primary"></div>
        <div class="modal-action px-10">
            <button class="btn w-1/2 text-gray-200 bg-gray-900 hover:bg-yellow-200 hover:text-gray-900" @click="closeModal_newChatConfirmModal">
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

<!-- namePlanModal -->
<dialog id="namePlanModal" class="modal">
    <div class="modal-box h-3/10 w-1/1 flex flex-col bg-gray-200">
        <div class="w-1/1 text-center text-black font-black bg-transparent rounded-xl">
            <span class="text-2xl">請幫訓練計劃取個名字.</span>
        </div>

        <input class="input w-1/1 border border-1 border-black p-2" type="text" v-model="planName" />

        <div class="divider divider-primary"></div>
        <div class="modal-action px-10">
            <button class="btn w-1/2 text-gray-200 bg-gray-900 hover:bg-yellow-200 hover:text-gray-900" @click="closeModal_namePlanModal">
                取消
            </button>

            <button class="btn w-1/2 text-gray-900 bg-gray-200 hover:bg-yellow-200 hover:text-gray-900" @click="namePlan">
                確認
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
