<script setup>
    import { ref, reactive, onMounted, nextTick } from 'vue'
    import moment from 'moment'
    import { fetchData } from "@/composables/fetchData"
    import { GoogleMap, AdvancedMarker, CustomControl, InfoWindow } from 'vue3-google-map'

    const emit = defineEmits(['popupMessage']);
    const props = defineProps({
        title: String,
        account: String,
        googleMapApiKey: String
    })

    onMounted(() => {
        console.log("PlanTrip mounted.");
        init();
    });

    let appState = ref("");
    let chatState = ref("TALKING");
    let userMessage = ref("");    
    let functionBarStatus = ref("OPEN");
    // 聊天室 UUID
    let chat_room_uuid = ref("INIT");
    let messages = reactive([]);
    let userInfo = reactive({});
    let aiRoles = reactive([]);
    let currentAiRole = reactive({});

    let trip_schedule_obj = {};
    let tripSumupList = reactive([]);
    let sel_day_sequence = ref("");
    let scheduleList = reactive([]);
    // 行程規劃範本
    let samplePromptList = reactive([]);
    // InfoWindow options
    let infoWindowObj = reactive({});
    // 圖標類型
    let googleMapMarkerType = reactive([]);
    // google map 初始中心點 - 台灣地理中心碑
    let mapCenter_lat = ref(23.974174340321614);
    let mapCenter_lng = ref(120.97984968163026);
    // google map mark
    let googleMapMarks = reactive([]);

    // 初始化 component
    function init(){
        console.log("PlanTrip.init");
        console.log("PlanTrip.props.title", props.title);
        console.log("PlanTrip.props.account", props.account);
        console.log("PlanTrip.props.googleMapApiKey", props.googleMapApiKey);

        fetchInitData();
        //chat("HI");
        remindPlan();
        // 建立行程規劃範本
        buildSamplePromptList();
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
        // 取得已排定行程清單
        scheduleList.splice(0, scheduleList.length);
        let fetchTripSchedulePromise = fetchData({
            api: "get_trip_schedule",
            data: {
                account: props.account,
            }
        });
        Promise.all([fetchAIRolesPromise, fetchUserInfoPromise, fetchTripSchedulePromise]).then((values) => {
            console.log("fetchInitData.values=", values);
            aiRoles = values[0];
            userInfo = values[1];

            // 建立已排定的行程清單
            {
                values[2].sort((x, y) => {
                    if(x["trip_start_date"] > y["trip_start_date"]){
                        return 1;
                    }
                    if(x["trip_start_date"] < y["trip_start_date"]){
                        return -1;
                    }

                    if(x["destination"] < y["destination"]){
                        return 1;
                    }
                    if(x["destination"] > y["destination"]){
                        return -1;
                    }

                    return 0;
                });
                values[2].forEach((schObj, sch_i) => {
                    let schedule = JSON.parse(schObj["schedule"]);
                    scheduleList.push( schedule );
                });
            }
        });
    }
    // 建立行程規劃範本
    function buildSamplePromptList(){
        // 電動機車行程
        {
            let samplePrompt = `
幫我安排一段機車之旅
交通工具: gogoro 電動機車
出發點: 台南市安南區 7-eleven 淵安門市
目的地: 雲林西市場
天數: 1 天 0 夜
開始日期: 未定
結束日期: 未定
嚴格必要-行程安排條件:
1. 休息停靠點, 皆需同時記錄景點名稱和地址
2. 休息停靠點, 皆安排在 Gogoro GoStation(換電站)
3. 休息停靠點之間, 騎車時間不超過 1 小時
4. 路線以台南->嘉義->雲林方式安排
非必要-行程安排條件:
1. 沒有
            `;
            samplePromptList.push({
                title: "電動機車旅行範本",
                content: samplePrompt,
            });
        }

        // 出國旅行
        {
            let samplePrompt = `
幫我安排一段出國旅行
出發點: 台南市安南區
目的地: 韓國釜山
參與人員: 2 位大人 2 位小孩, 小孩年齡分別是9歲和6歲
天數: 5 天 4 夜
開始日期: 未定
結束日期: 未定
嚴格必要-行程安排條件:
1. 休息停靠點, 皆需同時記錄景點名稱和地址
2. 當地交通工具: 以地鐵為主
3. 飲食習慣: 都安排熟食, 以不辣為主
4. 景點安排以戶外為主
非必要-行程安排條件:
1. 沒有

            `;
            samplePromptList.push({
                title: "出國旅行範本",
                content: samplePrompt,
            });
        }

        // 國內旅行
        {
            let samplePrompt = `
幫我安排一段國內旅行
出發點: 台南市安南區
目的地: 宜蘭縣蘇澳
參與人員: 2 位大人 2 位小孩, 小孩年齡分別是9歲和6歲
天數: 3 天 2 夜
開始日期: 未定
結束日期: 未定
嚴格必要-行程安排條件:
1. 休息停靠點, 皆需同時記錄景點名稱和地址
2. 交通工具: 以汽車為主
3. 飲食習慣: 都安排熟食, 以不辣為主
4. 景點安排以戶外為主
非必要-行程安排條件:
1. 沒有

            `;
            samplePromptList.push({
                title: "國內旅行範本",
                content: samplePrompt,
            });
        }
    }

    function importSamplePrompt(samplePromptObj){
        console.log("importSamplePrompt.samplePromptObj=", samplePromptObj);

        userMessage.value = samplePromptObj.content;
    }
    // chat with ai
    function chat(message){
        console.log("chat.message=" + message);
        // 關閉全部 modal
        closeAllModal();

        chatState.value = "TALKING";
        {
            // 讓 app scroll 到底
            let chatBoxElement = document.getElementById("chatBox");
            chatBoxElement.scrollTop = chatBoxElement.scrollHeight;
        }

        let chatPromise = fetchData({
            api: "plan_trip",
            data: {
                account: props.account,
                chat_room_uuid: chat_room_uuid.value,
                message: message,
                time: moment().format("YYYY-MM-DD HH:mm:ss"),
            }
        }, "AI");
        Promise.all([chatPromise]).then((values) => {
            console.log("chatPromise.values=", values);

            try{
                chat_room_uuid.value = values[0]["chat_room_uuid"];
                let ai_role = "AI";
                let ai_msg = values[0]["message"];
                let speaker = "";
                let short_name = "";
                aiRoles.forEach((roleObj, role_i) => {
                    if(roleObj["code"] === values[0]["ai_role"]){
                        speaker = roleObj["name"];
                        short_name = roleObj["short_name"];

                        currentAiRole["speaker"] = speaker;
                        currentAiRole["short_name"] = short_name;
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
            }catch(ex){
                let opObj = {
                    message: "剛剛 AI 可能暫離開位置, 麻煩再操作一次.",
                    status: false,
                };
                // 將 message 傳給 App.vue 
                emit('popupMessage', opObj.status, opObj.message); // Emitting the event with data

                chatState.value = "DONE";
            }
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
        });

        chat(userMessage.value);
    }        
    // 一鍵列出之前聊天內容
    function remindPlan(){
        let chat_msg = "";

        chat_msg += "如果之前的聊天內容中有任何行程相關的話題, ";
        chat_msg += "列出上次聊天的行程詳細內容";
        chat_msg += "回應上次聊天的行程詳細內容前, 請加上'Hello, 我們上次聊到的行程如下'";
        chat_msg += "回應上次聊天的行程詳細內容後, 請加上'有任何我幫得上忙的地方, 隨時跟我說~~";

        chat_msg += "如果之前的聊天內容中沒有任何行程相關的話題, 就直接和 user 打招呼";

        chat( chat_msg );
    }        
    // 開啟 sumup modal
    function openSumupModal(){
        // 關閉全部 Modal
        closeAllModal();

        // 整理聊天內容成"json"
        let chatPromise = fetchData({
            api: "sumup_trip",
            data: {
                account: props.account,
                chat_room_uuid: chat_room_uuid.value,
                message: "",
                time: moment().format("YYYY-MM-DD HH:mm:ss"),
            }
        }, "AI");
        Promise.all([chatPromise]).then((values) => {
            console.log("chatPromise.values=", values);

            let ai_msg = values[0]["message"];
            ai_msg = ai_msg.replace(/```/g, "").replace(/json/g, "").replace(/\n/g, "").trim();
            console.log("ai_msg=", ai_msg);
            trip_schedule_obj = JSON.parse(ai_msg);
            console.log("trip_schedule_obj=", trip_schedule_obj);

            tripSumupList.splice(0, tripSumupList.length);
            trip_schedule_obj.trip_detail.forEach((tdObj, td_i) => {
                tripSumupList.push(tdObj);
            });
            sel_day_sequence.value = tripSumupList[0].day_sequence;

            document.getElementById("sumupModal").showModal();

            drawGoogleMapMarker();
        });
    }
    // 繪畫圖標
    function drawGoogleMapMarker(){
        googleMapMarks.splice(0, googleMapMarks.length);

        let sel_day_sequence_obj = {};
        tripSumupList.forEach((tdObj, td_i) => {
            let day_sequence = tdObj.day_sequence;
            if(day_sequence === sel_day_sequence.value){
                sel_day_sequence_obj = tdObj;
            }
        });

        // 標註每個停靠點
        {
            let geoPromiseAry = [];
            sel_day_sequence_obj.trip_detail_of_day.forEach((tddObj, tdd_i) => {

                let locationName = trip_schedule_obj.nation;
                if( tddObj["subway_station"] && tddObj["subway_station"] !== "N/A" && tddObj["subway_station"].indexOf("無") < 0 ){
                    locationName += tddObj["subway_station"];
                }else{
                    locationName += tddObj["location"];
                }

                geoPromiseAry.push(fetchData({
                    api: "get_geocoded_from_google_map",
                    data: {
                        location_name: locationName,
                    }
                }));
            });
            Promise.all(geoPromiseAry).then((values) => {
                console.log("geocodedPromise.values=", values);

                values.forEach((geoObj, geo_i) => {
                    let latitude_of_tddObj = geoObj[0];
                    let longitude_of_tddObj = geoObj[1];

                    googleMapMarks.push({
                        location_name: sel_day_sequence_obj.trip_detail_of_day[geo_i]["location"],
                        mark_date: sel_day_sequence_obj.day_sequence + " - " + ((geo_i + 1) < 10 ? "0" : "") + (geo_i + 1),
                        type: "plan_a_trip",
                        memo: sel_day_sequence_obj.trip_detail_of_day[geo_i]["memo"],
                        marker: {
                            position: { 
                                lat: latitude_of_tddObj, 
                                lng: longitude_of_tddObj 
                            },
                            title: sel_day_sequence_obj.trip_detail_of_day[geo_i]["location"],
                        }
                    });
                });
            });
        }

        // 將 google map 中心點設定在目的地
        {
            let fetchCenterPromise = fetchData({
                api: "get_geocoded_from_google_map",
                data: {
                    location_name: trip_schedule_obj.nation + trip_schedule_obj.destination,
                }
            });
            Promise.all([fetchCenterPromise]).then((values) => {
                let latitude_of_tddObj = values[0][0];
                let longitude_of_tddObj = values[0][1];

                // 以目的地為中心點
                mapCenter_lat.value = latitude_of_tddObj;
                mapCenter_lng.value = longitude_of_tddObj;
            });
        }
        
    }
    // 選擇 TripSumupObj
    function clickSelTripSumup(tdObj){
        // console.log("clickSelTripSumup.tdObj=", tdObj);

        sel_day_sequence.value = tdObj.day_sequence;
        drawGoogleMapMarker();
    }
    // 開啟 InfoWindow
    function openInfoWindow(markObj){
        //console.log("openInfoWindow.markObj=", markObj);
        infoWindowObj.isOpen = true;
        infoWindowObj.options = {
            position: markObj.marker.position,
        };
        infoWindowObj.location_name = markObj.location_name;
        infoWindowObj.mark_date = markObj.mark_date;
        infoWindowObj.type = markObj.type;
        infoWindowObj.memo = markObj.memo;
    }
    // 關閉 InfoWindow
    function closeInfoWindow(){
        //console.log("infoWindow.closeclick");
        infoWindowObj.isOpen = false;
    }
    // 儲存行程規劃
    function saveTripSchedule(){
        console.log("saveTripSchedule.trip_schedule_obj=", trip_schedule_obj);

        let saveTripSchedulePromise = fetchData({
            api: "new_trip_schedule",
            data: {
                account: props.account,
                destination: trip_schedule_obj.destination,
                trip_start_date: trip_schedule_obj.trip_start_date ? trip_schedule_obj.trip_start_date : "",
                schedule: JSON.stringify( trip_schedule_obj ),
            }
        });
        Promise.all([saveTripSchedulePromise]).then((values) => {
            console.log("saveTripSchedulePromise.values=", values);

            closeSumupModal();

            let opObj = {
                message: "",
                status: true,
            };
            opObj.status = values[0]["result"];
            if(values[0]["result"] === true){
                opObj.message = "儲存成功";
            }else{
                opObj.message = "Error: " + values[0]["message"];
            }

            // 將 message 傳給 App.vue 
            emit('popupMessage', opObj.status, opObj.message); // Emitting the event with data
        });
    }
    // 開啟 Replan 再確認 modal
    function openReplanConfirmModal(){
        document.getElementById("replanConfirmModal").showModal();
    }
    // 關閉 Replan 再確認 modal
    function closeReplanConfirmModal(){
        document.getElementById("replanConfirmModal").close();
    }
    // 重新規畫 trip
    function replanTrip(json_onScheduleTrip = null){
        console.log("replanTrip");

        let removeTripPromise = fetchData({
            api: "remove_trip",
            data: {
                account: props.account,
            },
        }, "AI");
        Promise.all([removeTripPromise]).then((values) => {
            console.log("removeTripPromise.values=", values);
            // 清空聊天室內容
            messages.splice(0, messages.length);
            // 重新 chat
            chat_room_uuid.value = "INIT";

            if(typeof json_onScheduleTrip === "string"){
                let chat_msg = "";
                chat_msg += "幫我閱讀下列以 json 格式編寫的資料, 並以口語方式將內容回應給使用者,";
                chat_msg += "回應內容前請加上 'Hello, 關於這段旅程的規劃如下:'";
                chat_msg += "回應內容後請加上 '以上, 有需協助的地方, 儘管提出...'";
                chat_msg += json_onScheduleTrip;
                chat(chat_msg);
            }else{
                chat("HI");
            }
            // 關閉 replan 再確認 modal
            closeReplanConfirmModal();
            // 關閉 sumup modal
            closeSumupModal();
        });
    }
    // 關閉 sumup modal
    function closeSumupModal(){
        document.getElementById("sumupModal").close();
    }
    // 修改已排定行程
    function editOnScheduleTrip(schObj){
        console.log("editOnScheduleTrip.schObj=", schObj);
        let json_onScheduleTrip = JSON.stringify(schObj);
        // 清空先前聊天內容, 並列出已排定的旅行
        replanTrip(json_onScheduleTrip);
    }
    // 開啟 adjust schedule modal
    function openAdjustScheduleModal(){
        document.getElementById("adjustScheduleModal").showModal();
    }
    // 關閉 adjust schedule modal
    function closeAdjustScheduleModal(){
        document.getElementById("adjustScheduleModal").close();
    }
    // 開啟 sample modal
    function openSampleModal(){
        document.getElementById("sampleModal").showModal();
    }
    // 關閉 sample modal
    function closeSampleModal(){
        document.getElementById("sampleModal").close();
    }
    // 選擇 sample 
    function selectSample(spObj){
        console.log("selectSample.spObj=", spObj);
        // 清空聊天室內容
        messages.splice(0, messages.length);
        // 重新 chat
        chat_room_uuid.value = "INIT";
        userMessage.value = spObj.content;

        closeSampleModal();
    }
    // 關閉全部 modal
    function closeAllModal(){
        closeReplanConfirmModal();
        closeSumupModal();
        closeAdjustScheduleModal();
        closeSampleModal();
    }
    // 開啟/關閉 function bar
    function toggleFunctionBar(){
        functionBarStatus.value = functionBarStatus.value === "OPEN" ? "CLOSE" : "OPEN"; 
    }

</script>

<template>

<div class="w-1/1 h-1/1 flex flex-col rounded-xl border p-2 bg-gray-900">
    <!-- function button bar -->
    <div class="w-1/1 shadow-2xl flex flex-col bg-white rounded-xl">
        <div v-if="functionBarStatus === 'OPEN'" class="w-1/1 flex flex-row">
            <div class="flex-1 p-1">
                <textarea class="textarea w-1/1 h-1/1 rounded-xl" v-model="userMessage" placeholder="想說點什麼呢?" :disabled="chatState === 'TALKING'"></textarea>
            </div>
            <div class="flex-none p-1 flex-col w-1/4 min-w-10 max-w-30 h-1/1 gap-1">
                <button class="btn bg-blue-500/50 text-gray-900 hover:bg-gray-900 hover:text-gray-100 rounded-xl w-1/1 h-1/1" @click="send">
                    <span v-if="chatState !== 'TALKING'">傳送</span>
                    <span v-if="chatState === 'TALKING'" class="loading loading-spinner loading-md"></span>
                </button>
            </div>
        </div>
        <div class="w-1/1 flex flex-row gap-1 p-1 overflow-x-auto items-center"
             :class="{'justify-end': functionBarStatus === 'CLOSE'}">
            <div v-if="functionBarStatus === 'OPEN'" class="flex-1 flex flex-row gap-1 p-1 overflow-x-auto items-center">
                <button class="btn rounded-xl bg-red-300 text-gray-900 hover:bg-yellow-300" @click="openReplanConfirmModal">
                    新對話
                </button>
                <button class="btn rounded-xl bg-gray-300 hover:bg-yellow-300" @click="remindPlan">
                    回顧聊天
                </button>
                <button class="btn rounded-xl bg-fuchsia-300 hover:bg-yellow-300" @click="openSampleModal">
                    選擇範本
                </button>
                <button class="btn rounded-xl bg-indigo-300/70 text-black hover:bg-yellow-300 hover:text-gray-900" @click="openSumupModal">
                    統整行程
                </button>
                <button class="btn rounded-xl bg-emerald-400/70 text-black hover:bg-yellow-300 hover:text-gray-900" @click="openAdjustScheduleModal">
                    已排定的旅行
                </button>
            </div>
            <div class="flex-none p-1 items-center">
                <a class="cursor-pointer text-gray-400 hover:text-gray-900" @click="toggleFunctionBar">
                    <svg v-if="functionBarStatus === 'OPEN'" class="size-6" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                        <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m5 15 7-7 7 7"/>
                    </svg>
                    <svg v-if="functionBarStatus === 'CLOSE'" class="size-6" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                        <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m19 9-7 7-7-7"/>
                    </svg>
                </a>
            </div>
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

<!-- sample modal -->
<dialog id="sampleModal" class="modal modal-end md:modal-middle">
    <div class="modal-box h-1/1 w-1/1 flex flex-col bg-neutral-100">
        <div class="flex flex-col justify-center">
            <span class="text-xl text-gray-900 text-center">選擇範本</span>
        </div>
        <div class="h-7/10 w-10/10 flex flex-col overflow-y-auto gap-2">
            <div class="divider divider-primary"></div>

            <div class="w-1/1 bg-yellow-100 text-gray-900 p-1 flex flex-col rounded-xl">
                <div class="text-base md:text-lg">注意!</div>
                <div class="text-base md:text-lg">選擇範本會清空現有聊天內容!</div>
            </div>

            <div class="w-1/1 flex flex-col gap-2">
                <button v-for="(spObj, sp_i) in samplePromptList" class="btn hover:bg-yellow-200" @click="selectSample(spObj)">
                    <div>{{ spObj.title }}</div>
                </button>
            </div>
        </div>
        <div class="divider divider-primary"></div>
        <div class="modal-action">
            <button class="btn btn-ghost w-1/1 bg-gray-900 text-gray-100 hover:bg-gray-100 hover:text-gray-900" @click="closeSampleModal">
                關閉
            </button>
        </div>
    </div>
</dialog>

<!-- adjust schedule modal -->
<dialog id="adjustScheduleModal" class="modal modal-end md:modal-middle">
    <div class="modal-box h-1/1 w-1/1 flex flex-col bg-neutral-100">
        <div class="flex flex-col justify-center">
            <span class="text-xl text-gray-900 text-center">調整已排定的旅行</span>
        </div>
        <div class="h-7/10 w-10/10 flex flex-col overflow-y-auto gap-2">
            <div class="divider divider-primary"></div>

            <div class="w-1/1 bg-yellow-100 text-gray-900 p-1 flex flex-col rounded-xl">
                <div class="text-base md:text-lg">注意!</div>
                <div class="text-base md:text-lg">調整'已排定的旅行'會清空現有聊天內容!</div>
            </div>

            <div class="w-1/1 flex flex-col gap-2">
                <button v-for="(schObj, sch_i) in scheduleList" class="btn" @click="editOnScheduleTrip(schObj)">
                    <div>{{ schObj.destination }}</div>
                    <div class="text-xs">( {{ schObj.trip_start_date }} - {{ schObj.trip_end_date }} )</div>
                </button>
            </div>
        </div>
        <div class="divider divider-primary"></div>
        <div class="modal-action">
            <button class="btn btn-ghost w-1/1 bg-gray-900 text-gray-100 hover:bg-gray-100 hover:text-gray-900" @click="closeAdjustScheduleModal">
                關閉
            </button>
        </div>
    </div>
</dialog>

<!-- sumup modal -->
<dialog id="sumupModal" class="modal">
    <div class="modal-box h-10/10 w-10/10 max-w-3xl flex flex-col bg-neutral-100">
        <div class="w-10/10 flex flex-row overflow-x-auto">
            <button v-for="(tdObj, td_i) in tripSumupList" class="btn btn-ghost" :class="{ 'border-black': sel_day_sequence === tdObj.day_sequence}" @click="clickSelTripSumup(tdObj)">
                {{ tdObj.day_sequence }}
            </button>
        </div>
        <div class="h-4/10 w-10/10 flex flex-col overflow-y-auto">
            <div v-for="(tdObj, td_i) in tripSumupList">
                <ul class="list bg-yellow-100 rounded-box shadow-md">
                    <li v-if="sel_day_sequence === tdObj.day_sequence" v-for="(tddObj, tdd_i) in tdObj.trip_detail_of_day" class="list-row">
                        <div class="text-4xl font-thin opacity-30 tabular-nums">{{ ((tdd_i + 1) < 10 ? "0" : "") + (tdd_i + 1) }}</div>
                        <div class="list-col-grow">
                            <div class="text-lg">
                                {{ tddObj.location }}
                                <span v-if="tddObj.subway_station && tddObj.subway_station !== 'N/A' && tddObj.subway_station.indexOf('無') < 0">{{ " - 地鐵: " + tddObj.subway_station }}</span>
                            </div>
                            <div class="text-md uppercase font-semibold">{{ tddObj.memo }}</div>
                        </div>
                    </li>
                </ul>

            </div>
        </div>
        <div class="h-4/10 w-10/10 flex flex-col mt-1">
            <GoogleMap class="w-10/10 h-10/10 border"
                mapId="PLAN_TRIP_MAP_ID"
                :api-key="props.googleMapApiKey"
                :center="{ lat: mapCenter_lat, lng: mapCenter_lng }"
                :zoom="10"
                :mapTypeControl = "false" 
                :streetViewControl = "false"
                >
                
                <InfoWindow class="flex flex-col gap-2 pr-5 w-1/1" :options="infoWindowObj.options" v-model="infoWindowObj.isOpen" @closeclick="closeInfoWindow">
                    <div class="text-lg text-black">{{ infoWindowObj.mark_date }} - {{ infoWindowObj.location_name }}</div>    
                    <div class="text-base text-black">{{ infoWindowObj.memo }}</div>    
                </InfoWindow>

                <AdvancedMarker v-for="(markObj, m_i) in googleMapMarks" :options="markObj.marker" :pin-options="{ background: 'red' }" @click="openInfoWindow(markObj)">
                </AdvancedMarker>        
            </GoogleMap>
        </div>
        <div class="modal-action">
            <button class="btn btn-ghost w-1/2 bg-gray-900 text-gray-100 hover:underline hover:bg-gray-100 hover:text-black" @click="closeSumupModal">
                <svg class="size-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                    <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 9h5m3 0h2M7 12h2m3 0h5M5 5h14a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1h-6.616a1 1 0 0 0-.67.257l-2.88 2.592A.5.5 0 0 1 8 18.477V17a1 1 0 0 0-1-1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z"/>
                </svg>
                再聊聊
            </button>

            <button class="btn btn-ghost w-1/2 bg-gray-900 text-gray-100 hover:underline hover:bg-gray-100 hover:text-black" @click="saveTripSchedule">
                <svg class="size-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                    <path stroke="currentColor" stroke-linejoin="round" stroke-width="2" d="M10 3v4a1 1 0 0 1-1 1H5m14-4v16a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V7.914a1 1 0 0 1 .293-.707l3.914-3.914A1 1 0 0 1 9.914 3H18a1 1 0 0 1 1 1Z"/>
                </svg>
                儲存規畫
            </button>
        </div>
    </div>
    <form method="dialog" class="modal-backdrop">
        <button>close</button>
    </form>
</dialog>

<!-- replanConfirm modal -->
<dialog id="replanConfirmModal" class="modal">
    <div class="modal-box h-3/10 w-8/10 flex flex-col bg-neutral-500">
        <div class="h-10/10 w-10/10 text-center text-black font-black">
            <span class="text-2xl">再跟您確認一次~</span>
            <div class="divider divider-primary"></div>
        </div>
        <div class="modal-action">
            <button class="btn btn-ghost w-1/2 text-gray-900 bg-gray-100 hover:bg-gray-500 hover:text-gray-100 hover:underline" @click="closeReplanConfirmModal">
                話題繼續
            </button>

            <button class="btn btn-ghost w-1/2 text-gray-900 bg-gray-100 hover:bg-gray-500 hover:text-gray-100 hover:underline" @click="replanTrip">
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
