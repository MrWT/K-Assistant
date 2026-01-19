<script setup>
    import { ref, reactive, onMounted, watch } from 'vue'
    import { fetchData } from "@/composables/fetchData"
    import { GoogleMap, AdvancedMarker, InfoWindow, Polyline } from 'vue3-google-map'

    const emit = defineEmits(['popupMessage']);
    const props = defineProps({
        title: String,
        account: String,
    })

    onMounted(() => {
        console.log("FitnessPlan mounted.");
        init();
    });


    let appState = ref("");
    // 已排定的訓練計劃
    let planList = reactive([]);
    // 選擇要刪除的計畫
    let selRemove_id = ref("");
    let selRemove_planName = ref("");
    // 選擇要執行的計畫
    let selExecuteObj = reactive({});
    let selExecuteDaySeqList = reactive([]);
    let selExecuteItemList = reactive([]);

    // 初始化 component
    function init(){
        console.log("FitnessPlan.init");
        console.log("FitnessPlan.props.title", props.title);
        console.log("FitnessPlan.props.account", props.account);

        fetchInitData();
    }
    // 取得初始資料
    function fetchInitData(){
        // 清空訓練計畫
        planList.splice(0, planList.length);
        // 取得訓練計畫
        let fetchPromise_plan = fetchData({
            api: "get_fitness_plans",
            data: {
                account: props.account,
            }
        });
        Promise.all([fetchPromise_plan]).then((values) => {
            console.log("fetchInitData.values=", values);

            values[0].forEach((planObj, plan_i) => {
                planList.push(planObj);
            });

        });
    }
    
    // 開啟 removeConfirmModal
    function openModal_removeConfirmModal(selPlanObj){
        console.log("openModal_removeConfirmModal.selPlanObj=", selPlanObj);

        selRemove_id.value = selPlanObj["id"];
        selRemove_planName.value = selPlanObj["plan_name"];
        document.getElementById("removeConfirmModal").showModal();
    }
    // 執行刪除
    function doRemove(planObj){
        let removePromise = fetchData({
            api: "delete_fitness_plan",
            data: {
                id: selRemove_id.value,
            }
        });
        Promise.all([removePromise]).then((values) => {
            console.log("removePromise.values=", values);

            if(values[0]["result"] === true){
                fetchInitData();
                emit('popupMessage', true, "已完成刪除"); // Emitting the event with data
                closeModal_removeConfirmModal();
            }else{
                emit('popupMessage', false, values[0]["message"]); // Emitting the event with data
            }
        });
    }
    // 關閉 removeConfirmModal
    function closeModal_removeConfirmModal(){
        document.getElementById("removeConfirmModal").close();
    }

    // 開啟 executeModal
    function openModal_executeModal(selPlanObj){
        selExecuteObj = selPlanObj;
        console.log("openModal_executeModal.selPlanObj=", selPlanObj);
        //console.log("openModal_executeModal.selExecuteObj=", selExecuteObj);

        // 清空資料集合
        {
            selExecuteDaySeqList.splice(0, selExecuteDaySeqList.length);
            selExecuteItemList.splice(0, selExecuteItemList.length);
        }

        // 取得訓練計畫-細項
        let fetchPromise_planItem = fetchData({
            api: "get_fitness_plan_items",
            data: {
                plan_no: selExecuteObj["plan_no"],
            }
        });
        Promise.all([fetchPromise_planItem]).then((values) => {
            console.log("fetchPromise_planItem.values=", values);

            values[0].forEach((itemObj, item_i) => {

                if(selExecuteDaySeqList.indexOf(itemObj["day_seq"]) < 0){
                    selExecuteDaySeqList.push(itemObj["day_seq"]);
                }
                
                // 執行狀態
                selExecuteItemList.push(itemObj);
            });
            selExecuteDaySeqList.sort();
            selExecuteItemList.sort((x, y) => {
                if(x["day_seq"] < y["day_seq"]) return -1;
                if(x["day_seq"] > y["day_seq"]) return 1;
                if(x["day_seq"] === y["day_seq"]){
                    if(x["item_seq"] < y["item_seq"]) return -1;
                    if(x["item_seq"] > y["item_seq"]) return 1;
                    if(x["item_seq"] === y["item_seq"]) return 0;
                }
            });

            console.log("openModal_executeModal.selExecuteDaySeqList=", selExecuteDaySeqList);
            console.log("openModal_executeModal.selExecuteItemList=", selExecuteItemList);

            document.getElementById("executeModal").showModal();
            // 更新進度
            updateProgress_UI();
        });
    }
    // 執行計畫
    function saveExecute(){
        console.log("saveExecute.selExecuteItemList=", selExecuteItemList);

        let promiseList = [];
        selExecuteItemList.forEach((itemObj, item_i) => {
            promiseList.push(
                fetchData({
                    api: "update_exe_status_fitness_plan_item",
                    data: {
                        plan_no: selExecuteObj["plan_no"],
                        day_seq: itemObj["day_seq"],
                        item_seq: itemObj["item_seq"],
                        exe_status: itemObj["exe_status"],
                    }
                })
            );
        });
        Promise.all(promiseList).then((values) => {
            console.log("saveExecute.values=", values);
            // 更新進度 - DB
            updateProgress_DB();
        });
    }
    // 更新進度 - DB
    function updateProgress_DB(){

        let updatePromise = fetchData({
            api: "update_progress_fitness_plan",
            data: {
                plan_no: selExecuteObj["plan_no"],
                progress: selExecuteObj["progress"],
            }
        });
        Promise.all([updatePromise]).then((values) => {
            console.log("updatePromise.values=", values);          

            if(values[0]["result"] === true){
                emit('popupMessage', true, "已完成更新"); // Emitting the event with data
            }else{
                emit('popupMessage', false, "更新失敗!! ERROR=" + values[0]["message"]); // Emitting the event with data
            }
            closeModal_executeModal();
            fetchInitData();
        });
    }
    // 更新進度 - UI
    function updateProgress_UI(){
        let itemCount = selExecuteItemList.length;
        let finishItemCount = 0;
        selExecuteItemList.forEach((itemObj, item_i) => {
            if(itemObj["exe_status"]){
                finishItemCount += 1;
            }
        });
        selExecuteObj.progress = Math.floor( finishItemCount * 10000 / itemCount ) / 100;
    }
    // 關閉 executeModal
    function closeModal_executeModal(){
        document.getElementById("executeModal").close();
    }

    // 監聽
    watch(selExecuteItemList, (newValue, oldValue) => {
        // 即時更新"執行進度"
        updateProgress_UI();
    });

</script>

<template>

<div class="w-1/1 h-1/1">
    <ul v-if="planList.length > 0" class="list rounded-box shadow-md h-1/1">
        <li v-for="(planObj, plan_i) in planList" class="list-row hover:bg-yellow-100 items-center">
            <div class="text-4xl font-thin opacity-30 tabular-nums">{{ ((plan_i + 1) < 10 ? "0" : "") + (plan_i + 1) }}</div>
            <div class="list-col-grow">
                <div class="text-xl underline">
                    {{ planObj.plan_name }}
                </div>
                <div class="text-xs">
                    {{ planObj.create_time }}
                </div>
            </div>
            <div class="badge"
                :class="{
                    'badge-error text-white': planObj.progress < 50, 
                    'badge-warning': 50 <= planObj.progress && planObj.progress < 70,
                    'badge-success text-white': 70 <= planObj.progress && planObj.progress < 90,
                    'badge-info text-white': 90 <= planObj.progress && planObj.progress < 100,
                    'badge-neutral': 100 <= planObj.progress
                }">
                {{ planObj.progress }} %
            </div>
            <a class="cursor-pointer text-red-500 hover:text-red-900" title="刪除計劃" @click="openModal_removeConfirmModal(planObj)">
                <svg class="size-6" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                    <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m15 9-6 6m0-6 6 6m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
                </svg>
            </a>
            <a class="cursor-pointer text-gray-500 hover:text-gray-900" title="計劃內容" @click="openModal_executeModal(planObj)">
                <svg class="size-6" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                    <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 9h6m-6 3h6m-6 3h6M6.996 9h.01m-.01 3h.01m-.01 3h.01M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z"/>
                </svg>
            </a>
        </li>
    </ul>
    <div class="w-1/1 text-center bg-gray-300 rounded-xl p-3">
        <span class="text-gray-900 font-black text-3xl underline" v-if="planList.length === 0">查無資料</span>
    </div>
</div>

<!-- execute modal -->
<dialog id="executeModal" class="modal">
    <div class="modal-box h-1/1 max-w-1/1 flex flex-col bg-gray-200">
        <div class="h-1/10 w-1/1 text-gray-900 font-black flex flex-col place-items-center">
            <div class="text-2xl underline">執行計畫</div>
            <div class="text-lg">
                {{ selExecuteObj.plan_name }}
                <span class="px-2" 
                    :class="{
                        'bg-error text-white': selExecuteObj.progress < 50, 
                        'bg-warning': 50 <= selExecuteObj.progress && selExecuteObj.progress < 70,
                        'bg-success text-white': 70 <= selExecuteObj.progress && selExecuteObj.progress < 90,
                        'bg-info text-white': 90 <= selExecuteObj.progress && selExecuteObj.progress < 100,
                        'bg-neutral-900 text-white': 100 <= selExecuteObj.progress
                    }">
                    ( {{ selExecuteObj.progress }} % )
                </span>
            </div>
        </div>
        <div class="divider divider-primary"></div>

        <div class="w-1/1 h-9/10 flex flex-col overflow-y-auto">
            <div v-for="(day_seq, ds_i) in selExecuteDaySeqList" class="flex flex-col">
                <span class="x-1/1">
                    < 第 {{ day_seq + 1 }} 天 > <span class="underline">{{ selExecuteObj.purposes[day_seq] }}</span>
                </span>
                <div v-for="(itemObj, item_i) in selExecuteItemList">
                    <div v-if="itemObj.day_seq === day_seq" 
                        class="pl-5 py-2 w-1/1 flex flex-row gap-2 hover:bg-yellow-200"
                        :class="{'bg-lime-100': itemObj.exe_status}">
                        
                        <input type="checkbox" class="flex-none" v-model="itemObj.exe_status" />
                        
                        <div class="flex-1 flex flex-col">
                            <span class="text-xl text-blue-900">
                                {{ itemObj.name }} {{ itemObj.frequency }}
                            </span>
                            <span class="text-xs">
                                {{ itemObj.purpose }}
                            </span>
                        </div>
                    </div>
                </div>
                <div class="divider"></div>
            </div>
        </div>

        <div class="divider divider-primary"></div>
        <div class="modal-action gap-2 px-5">
            <a class="w-1/2 rounded-xl text-center p-2 cursor-pointer bg-gray-900 text-gray-200 hover:bg-yellow-200 hover:text-gray-900" @click="closeModal_executeModal">
                關閉
            </a>

            <a class="w-1/2 rounded-xl text-center p-2 cursor-pointer bg-gray-300 text-gray-900 hover:bg-yellow-200 " @click="saveExecute" >
                儲存執行狀態
            </a>
        </div>
    </div>
    <form method="dialog" class="modal-backdrop">
        <button>close</button>
    </form>
</dialog>

<!-- removeConfirm modal -->
<dialog id="removeConfirmModal" class="modal">
    <div class="modal-box h-5/10 w-10/10 flex flex-col bg-gray-200">
        <div class="h-2/10 w-10/10 text-center text-gray-900 font-black">
            <span class="text-2xl">刪除前, 再跟您確認一次~</span>
        </div>
        <div class="divider divider-error"></div>

        <div class="w-1/1 text-center text-xl">
            {{ selRemove_planName }}
        </div>

        <div class="divider divider-error"></div>
        <div class="modal-action gap-2 px-5">
            <a class="w-1/2 rounded-xl text-center p-2 cursor-pointer bg-gray-900 text-gray-200 hover:bg-yellow-200 hover:text-gray-900" @click="closeModal_removeConfirmModal">
                取消
            </a>

            <a class="w-1/2 rounded-xl text-center p-2 cursor-pointer bg-gray-300 text-gray-900 hover:bg-yellow-200 " @click="doRemove" >
                確認
            </a>
        </div>
    </div>
    <form method="dialog" class="modal-backdrop">
        <button>close</button>
    </form>
</dialog>

</template>

<style scoped>

</style>
