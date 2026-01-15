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
            <a class="cursor-pointer text-red-500 hover:text-red-900" title="刪除計劃" @click="openModal_removeConfirmModal(planObj)">
                <svg class="size-6" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                    <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m15 9-6 6m0-6 6 6m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
                </svg>
            </a>
            <a class="cursor-pointer text-gray-500 hover:text-gray-900" title="計劃內容">
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
            <button class="btn w-1/2 bg-gray-900 text-gray-200 hover:bg-yellow-200 hover:text-gray-900" @click="closeModal_removeConfirmModal">
                取消
            </button>

            <button class="btn w-1/2 bg-gray-400 text-gray-900 hover:bg-yellow-200 " @click="doRemove" >
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
