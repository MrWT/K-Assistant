<script setup>
    import { ref, reactive, onMounted, watch } from 'vue'
    import moment from 'moment'
    import { fetchData } from "@/composables/fetchData"

    import SettingFinance from '@/components_kuoFund/SettingFinance.vue'

    const emit = defineEmits(['popupMessage']);
    const props = defineProps({
        title: String,
        account: String,
        user_role: String,
    })

    onMounted(() => {
        console.log("Finance mounted.");
        init();
    });

    let appState = ref("");

    let funds_total = ref(0);
    let funds_members = reactive([]);
    let funds = reactive([]);
    let funds_months = reactive([]);
    let sel_dataMN = ref("");
    let todayMN = ref(moment().format("YYYY-MM"));

    let delRecordObj = reactive({});

    /* ********************
     * *** Search Modal ***
     * ******************** */
    // 查詢 - 狀態
    let searchStatus = ref("INIT");
    // 查詢 - 選項
    let promptOptions = reactive({
        time: [],
        member: [],
    });
    // 查詢 - 選擇結果
    let promptTime = ref("All");
    let promptMember = ref("All");
    let promptSort = ref("由晚到早");
    // 給 AI 的 search prompt
    let prompt = ref("");
    // 查詢結果
    let searchResult = ref("");

    // 初始化 component
    function init(){
        console.log("Finance.init");
        console.log("Finance.props.title", props.title);
        console.log("Finance.props.account", props.account);
        console.log("Finance.props.user_role", props.user_role);
        
        // 取得初始資料
        fetchInitData();
    }    
    // 取得初始資料
    function fetchInitData(){
        sel_dataMN.value = "";

        //console.log("fetchInitData");
        // 清空結餘
        funds_total.value = 0;
        // 取得資料月份
        let fetchFundsMonthPromise = fetchData({
            api: "get_finance_month",
        }, "KUO-FUNDS");
        // 取得總結餘
        let fetchFundsTotalPromise = fetchData({
            api: "get_finance_total",
        }, "KUO-FUNDS");
        // 取得成員
        let fetchMembersPromise = fetchData({
            api: "get_members",
        }, "KUO-FUNDS");
        Promise.all([fetchFundsTotalPromise, fetchFundsMonthPromise, fetchMembersPromise]).then((values) => {
            console.log("fetchFundsPromise.values=", values);
            // 帳務結餘
            funds_total.value = values[0];

            // 帳務月份
            {
                // clear month list
                funds_months.splice(0, funds_months.length);
                values[1].forEach((fmn, fmn_i) => {
                    funds_months.push(fmn);
                });

                if(!funds_months.includes(moment().format("YYYY-MM"))){
                    funds_months.push(moment().format("YYYY-MM"));
                }

                funds_months.sort((x, y) => {
                    if( x < y ){
                        return 1;
                    }
                    if( x > y ){
                        return -1;
                    }
                    return 0;
                });

                // 查詢帳務 - 帳務月份
                {
                    // clear month list
                    promptOptions.time.splice(0, promptOptions.time.length);
                    promptOptions.time.push({ value: "All", text: "All", });
                    funds_months.forEach((fmn, fmn_i) => {
                        let f_fmn = fmn.split("-")[0] + " 年 " + fmn.split("-")[1] +  " 月 ";
                        promptOptions.time.push(
                            { value: f_fmn, text: f_fmn, }
                        );
                    });
                }
            }

            // 成員
            {
                values[2].sort((x, y) => {
                    if(x["code_name"] < y["code_name"]) return -1;
                    if(x["code_name"] > y["code_name"]) return 1;
                    return 0;
                });

                // clear member list
                funds_members.splice(0, funds_members.length);
                values[2].forEach((memObj, mem_i) => {
                    funds_members.push(memObj);
                });

                 // 查詢帳務 - 成員們
                {
                    // clear member list
                    promptOptions.member.splice(0, promptOptions.member.length);
                    promptOptions.member.push({ value: "All", text: "All", });
                    values[2].forEach((memObj, mem_i) => {
                        promptOptions.member.push(
                            { value: memObj["name"], text: memObj["name"], }
                        );
                    });
                }
            }
           
        }).then(() => {
            sel_dataMN.value = moment().format("YYYY-MM");
        });
    }
    // 選擇查閱的資料月份
    function clickDataMN(dataYM){
        sel_dataMN.value = dataYM;
    }
    // 取得特定月份儲值/提領紀錄
    function fetchFunds(dataYM){
        console.log("fetchFunds.dataYM=", dataYM);

        let fetchFundsPromise = fetchData({
            api: "get_finance",
            data: {
                dataYM: dataYM,
            },
        }, "KUO-FUNDS");
        Promise.all([fetchFundsPromise]).then((values) => {
            console.log("fetchFundsPromise.values=", values);

            funds.splice(0, funds.length);
            values[0].forEach((fundObj, f_i) => {
                // 找到紀錄姓名
                for(let mem_i = 0; mem_i < funds_members.length; mem_i++){
                    let memObj = funds_members[mem_i];
                    if(memObj["code_name"] === fundObj["code_name"]){
                        fundObj["name"] = memObj["name"];
                        break;
                    }
                }
                funds.push(fundObj);
            });
            // 排序
            funds.sort((x, y) => {
                // 依 code_name 排序
                if(x["code_name"] > y["code_name"]) return 1;
                if(x["code_name"] < y["code_name"]) return -1;
                if(x["code_name"] === y["code_name"]){
                    // 依日期排序
                    if( x["date"] < y["date"] ) return 1;
                    if( x["date"] > y["date"] ) return -1;
                    if( x["date"] === y["date"] ) return 0;
                }
            });
        });

    }
    // 跳出失效再確認 modal
    function popupDelConfirmModal(delObj){
        delRecordObj["code_name"] = delObj["code_name"];
        delRecordObj["name"] = delObj["name"];
        delRecordObj["type"] = delObj["type"];
        delRecordObj["date"] = delObj["date"];
        console.log("popupDelConfirmModal.delRecordObj=", delRecordObj);

        document.getElementById("delConfirmModal").showModal();
    }
    // 取消失效再確認 modal
    function cancelPopupDelConfirmModal(){
        document.getElementById("delConfirmModal").close();
    }
    // 失效儲值/提領紀錄
    function deleteRecord(){
        console.log("deleteRecord.delRecordObj=", delRecordObj);

        let delFinanceKFPromise = fetchData({
            api: "del_finance",
            data: {
                finance: delRecordObj,
            }
        }, "KUO-FUNDS");
        Promise.all([delFinanceKFPromise]).then((values) => {
            console.log("delFinanceKFPromise.values=", values);

            let opObj = {
                message: "",
                status: true,
            };
            opObj.status = values[0]["result"];
            if(values[0]["result"] === true){
                opObj.message = "失效成功";
                // 更新資料
                fetchInitData();
            }else{
                opObj.message = values[0]["message"];
            }

            document.getElementById("delConfirmModal").close();
            // 將 message 傳給 Setting.vue 
            emit('popupMessage', opObj.status, opObj.message); // Emitting the event with data
        });
    }
    // 開啟 search modal
    function openSearchModal(){
        searchStatus.value = "INIT";
        searchResult.value = "";
        promptTime.value = "All";
        promptMember.value = "All";
        promptSort.value = "由晚到早";
        document.getElementById("searchModal").showModal();
    }
    // 查詢帳務
    function doSearch(){
        searchStatus.value = "SEARCHING";
        searchResult.value = "";

        let selTime = promptTime.value === "All" ? "全部時間" : promptTime.value;
        let selMember = promptMember.value === "All" ? "全部成員" : promptMember.value;
        prompt.value = "幫我列出 " + selTime + " " + selMember + " 的帳務紀錄(依時間排序:" + promptSort.value + ")";

        let chatPromise = fetchData({
            api: "check_accounts",
            data: {
                account: props.account,
                chat_room_uuid: "INIT",
                message: prompt.value,
                time: moment().format("YYYY-MM-DD HH:mm:ss"),
            }
        }, "KUO-FUNDS");
        Promise.all([chatPromise]).then((values) => {
            console.log("chatPromise.values=", values);

            let ai_msg = values[0].message;
            if(ai_msg.indexOf("ERROR:") === 0){
                if(ai_msg.indexOf("ERROR:429 RESOURCE_EXHAUSTED") === 0){
                    emit('popupMessage', false, "AI 忙碌中... 請稍等再查詢..."); // Emitting the event with data
                    ai_msg = "AI 忙碌中... 請稍等再查詢...";
                }else{
                    emit('popupMessage', false, ai_msg); // Emitting the event with data
                }
            }
            searchResult.value = ai_msg;

            searchStatus.value = "DONE";
        });
    }
    // 開啟 setting modal
    function openSettingModal(){
        document.getElementById("settingModal").showModal();
    }
    // 關閉 setting modal
    function closeSettingModal(){
        document.getElementById("settingModal").close();
    }
    // 給 Setting Modal 使用的 function
    function modalStatus(opMode, message){
        if(opMode === "SAVE_SUCCESS"){
            emit('popupMessage', true, message); // Emitting the event with data
            // 更新資料
            fetchInitData();
        }else if(opMode === "SAVE_FAIL"){
            emit('popupMessage', false, message); // Emitting the event with data
        }

        closeSettingModal();
    }

    // 監聽 sel_dataMN
    watch(sel_dataMN, (newDataMN, oldDataMN) => {
        console.log("watch.sel_dataMN.newDataMN=", newDataMN);

        if(newDataMN){
            fetchFunds(newDataMN);
        }
    });
</script>

<template>

<div class="w-1/1 h-11/12">
    <div class="flex-none w-1/1 flex flex-col">
        <div class="w-1/1 flex flex-row">
            <div class="w-3/4 text-3xl text-center p-2 rounded-xl" 
                 :class="{'bg-gray-200': funds_total === 0, 'bg-green-200': funds_total > 0, 'bg-red-200': funds_total < 0}">
                結餘：$ {{ new Intl.NumberFormat().format( funds_total ) }}
            </div>
            <div class="w-1/4 flex flex-row justify-end items-center gap-2">
                <a class="cursor-pointer text-gray-400 hover:text-gray-900" @click="openSearchModal">
                    <svg class="size-6" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                        <path stroke="currentColor" stroke-linecap="round" stroke-width="2" d="m21 21-3.5-3.5M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z"/>
                    </svg>
                </a>
                <a v-if="props.user_role === 'admin_kf'" class="cursor-pointer text-gray-400 hover:text-gray-900" @click="openSettingModal">
                    <svg class="size-6" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                        <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13v-2a1 1 0 0 0-1-1h-.757l-.707-1.707.535-.536a1 1 0 0 0 0-1.414l-1.414-1.414a1 1 0 0 0-1.414 0l-.536.535L14 4.757V4a1 1 0 0 0-1-1h-2a1 1 0 0 0-1 1v.757l-1.707.707-.536-.535a1 1 0 0 0-1.414 0L4.929 6.343a1 1 0 0 0 0 1.414l.536.536L4.757 10H4a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h.757l.707 1.707-.535.536a1 1 0 0 0 0 1.414l1.414 1.414a1 1 0 0 0 1.414 0l.536-.535 1.707.707V20a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-.757l1.707-.708.536.536a1 1 0 0 0 1.414 0l1.414-1.414a1 1 0 0 0 0-1.414l-.535-.536.707-1.707H20a1 1 0 0 0 1-1Z"/>
                        <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/>
                    </svg>
                </a>
            </div>
        </div>
        <div class="w-1/1 flex flex-row overflow-x-auto overflow-y-hidden shadow-2xl">
            <button v-for="(f_mn, f_mn_i) in funds_months" @click="clickDataMN(f_mn)"
                        class="btn btn-ghost rounded-none border-0 border-b-2 hover:border-rose-500 mx-1"
                        :class="{'border-amber-600': f_mn === sel_dataMN, 'border-gray-500': f_mn !== sel_dataMN}">
                {{ f_mn }}
            </button>
        </div>
    </div>
    <div class="flex-1 w-1/1 h-11/12 flex flex-col overflow-y-auto">
        <div v-for="(fundObj, fund_i) in funds" class="chat"
            :class="{ 'chat-start': fundObj.type === 'IN', 'chat-end': fundObj.type === 'OUT' }">
            <div class="chat-image avatar">
                <div class="avatar avatar-placeholder">
                    <div class="w-12 rounded-full"
                        :class="{'bg-green-900': fundObj.type === 'IN', 'bg-red-900': fundObj.type === 'OUT'}">
                        <span v-if="fundObj.type === 'IN'" class="text-lg text-white">儲值</span>
                        <span v-if="fundObj.type === 'OUT'" class="text-lg text-white">提領</span>
                    </div>
                </div>
            </div>
            <div class="chat-header">
                <span class="text-base">{{ fundObj.name }}</span>
                <time class="text-base opacity-50">{{ fundObj.date }}</time>
            </div>
            <div class="chat-bubble">
                <span v-if="props.user_role === 'admin_kf' && todayMN <= sel_dataMN" class="mr-2 font-black text-red-900 cursor-pointer" @click="popupDelConfirmModal(fundObj)">X</span>
                $ {{ new Intl.NumberFormat().format( fundObj.money ) }}
                <span v-if="fundObj.memo !== ''">( {{ fundObj.memo }} )</span>
            </div>
        </div>
        <div v-if="funds.length === 0" class="text-3xl text-center w-1/1">
            請稍等, 查詢資料中<span class="loading loading-dots loading-xs"></span>
        </div>
    </div>
</div>

<!-- 失效再確認 -->
<dialog id="delConfirmModal" class="modal">
    <div class="modal-box bg-gray-800/80 rounded-box p-2 w-80 md:w-120">
        <li class="text-white text-xl">{{ "確定要失效以下資料嗎?" }}</li>
        <div class="divider divider-primary"></div>
        <li class="text-white text-lg">姓名: {{ delRecordObj.name }}</li>
        <li class="text-white text-lg">儲值或提領: {{ delRecordObj.type === "IN" ? "儲值" : "提領" }}</li>
        <li class="text-white text-lg">日期: {{ delRecordObj.date }}</li>
        <div class="divider divider-primary"></div>
        <li class="flex flex-row gap-2 w-10/10">
            <button class="btn w-5/10" @click="cancelPopupDelConfirmModal">
                取消
            </button>
            <button class="btn w-5/10" @click="deleteRecord">
                確認
            </button>
        </li>
    </div>
    <form method="dialog" class="modal-backdrop">
        <button>close</button>
    </form>
</dialog>

<!-- 帳務查詢 -->
<dialog id="searchModal" class="modal">
    <div class="modal-box bg-gray-200 rounded-box p-2 w-1/1 max-h-1/1">
        <form v-if="searchStatus !== 'SEARCHING'" method="dialog">
            <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
        </form>
        <div class="w-1/1 flex flex-col justify-center">
            <span class="text-xl text-gray-900 text-center">帳務查詢</span>
            <div class="divider divider-primary"></div>
        </div>
        <div class="w-1/1 flex flex-col overflow-y-auto">
            <div class="w-1/1 grid grid-cols-6">
                <div>&nbsp;</div>
                <div class="col-span-4 col-start-2 flex flex-row">
                    <div class="flex-1">
                        <div class="w-1/1 flex flex-row p-2">
                            <div class="flex-none pr-2">
                                時間:
                            </div>
                            <div class="flex-1">
                                <select v-model="promptTime" class="w-1/1 border" :disabled="searchStatus === 'SEARCHING'">
                                    <option v-for="(tObj, t_i) in promptOptions.time" :value="tObj.value">{{ tObj.text }}</option>
                                </select>
                            </div>
                        </div>
                        <div class="w-1/1 flex flex-row p-2">
                            <div class="flex-none pr-2">
                                成員:
                            </div>
                            <div class="flex-1">
                                <select v-model="promptMember" class="w-1/1 border" :disabled="searchStatus === 'SEARCHING'">
                                    <option v-for="(mObj, m_i) in promptOptions.member" :value="mObj.value">{{ mObj.text }}</option>
                                </select>
                            </div>
                        </div>
                        <div class="w-1/1 flex flex-row p-2">
                            <div class="flex-none pr-2">
                                排序:
                            </div>
                            <div class="flex-1">
                                <label>
                                    <input type="radio" v-model="promptSort" value="由晚到早" />
                                    由晚到早
                                </label>
                                <label>
                                    <input type="radio" v-model="promptSort" value="由早到晚" />
                                    由早到晚
                                </label>
                            </div>
                        </div>
                    </div>
                    <div class="flex-none">
                        <button class="btn w-20 rounded-lg h-1/1 bg-gray-800 text-gray-100 hover:bg-yellow-100 hover:text-gray-800" :disabled="searchStatus === 'SEARCHING'" @click.stop="doSearch">
                            <span v-if="searchStatus !== 'SEARCHING'" >查詢</span>  
                            <span v-if="searchStatus === 'SEARCHING'" class="loading loading-spinner loading-xs"></span>
                        </button>
                    </div>
                </div>
            </div>
            <div class="divider divider-primary"></div>
            <div class="w-1/1 h-80 p-5">
                <label class="h-1/1">
                    查詢結果:
                    <textarea class="textarea w-1/1 h-4/5" readonly>{{ searchResult }}</textarea>
                </label>
            </div>
        </div>
    </div>
</dialog>

<!-- setting modal -->
<dialog id="settingModal" class="modal">
    <div class="modal-box h-5/6 w-1/1 flex flex-col bg-neutral-100">
        <form method="dialog">
            <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
        </form>
        <div class="w-1/1 flex flex-col justify-center">
            <span class="text-xl text-gray-900 text-center">調整帳務</span>
            <div class="divider divider-primary"></div>
        </div>

        <SettingFinance :title="props.title" :account="props.account" @modal-status="modalStatus" />
    </div>
</dialog>

</template>

<style scoped>

</style>
