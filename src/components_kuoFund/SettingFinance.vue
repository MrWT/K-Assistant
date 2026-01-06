<script setup>
    import { ref, reactive, onMounted } from 'vue'
    import moment from 'moment'
    import { fetchData } from "@/composables/fetchData"

    const emit = defineEmits(['modalStatus']);
    const props = defineProps({
        title: String,
        account: String,
    })

    onMounted(() => {
        console.log("Setting_Finance mounted.");
        init();
    });

    let financeObj = reactive({
        code_name: "",
        type: "IN",
        money: 500,
        date: moment().format("YYYY-MM-DD"),
        memo: "",
    });
    let members = reactive([]);

    // 初始化 component
    function init(){
        console.log("SettingFinance.init");
        console.log("props.title=" + props.title);
        console.log("props.account=" + props.account);

        fetchMembers();
    }
    // 取得 finance 資料
    function fetchMembers(){
        let fetchMembersPromise = fetchData({
            api: "get_members",
        }, "KUO-FUNDS");
        Promise.all([fetchMembersPromise]).then((values) => {
            console.log("fetchMembersPromise.values=", values[0]);

            // 郭家基金 - 成員
            members.splice(0, members.length);

            let memObjs = values[0];
            memObjs.sort((x, y) => {
                if(x["code_name"] > y["code_name"]) return 1;
                if(x["code_name"] < y["code_name"]) return -1;
                if(x["code_name"] === y["code_name"]) return 0;
            });
            memObjs.forEach((memObj, m_i) => {
                members.push(memObj);
            });
        });
    }    
    // 新增 financeObj 單筆資料
    function newRecord(){
        console.log("newRecord.financeObj=", financeObj);

        let newFinanceKFPromise = fetchData({
            api: "new_finance",
            data: {
                finance: financeObj,
            }
        }, "KUO-FUNDS");
        Promise.all([newFinanceKFPromise]).then((values) => {
            console.log("newFinanceKFPromise.values=", values);

            let opObj = {
                message: "",
                status: true,
            };
            opObj.status = values[0]["result"];
            if(values[0]["result"] === true){
                opObj.message = "儲存成功";
            }else{
                opObj.message = values[0]["message"];
            }

            // 還原設定值
            financeObj.code_name = "";
            financeObj.type = "IN";
            financeObj.money = 500;
            financeObj.date = moment().format("YYYY-MM-DD");
            financeObj.memo = "";

            if(opObj.status){
                emit('modalStatus', "SAVE_SUCCESS", opObj.message); // Emitting the event with data
            }else{
                emit('modalStatus', "SAVE_FAIL", opObj.message); // Emitting the event with data
            }
        });
    }
    // 關閉 modal
    function closeSettingModal(){
        // 還原設定值
        financeObj.code_name = "";
        financeObj.type = "IN";
        financeObj.money = 500;
        financeObj.date = moment().format("YYYY-MM-DD");
        financeObj.memo = "";

        emit('modalStatus', "CLOSE", ""); // Emitting the event with data
    }
</script>

<template>

    <div class="w-1/1 flex flex-col gap-2">
        <div class="flex flex-row gap-2 w-1/1">
            <label class="text-green-900 text-lg w-1/2">
                <input type="radio" v-model="financeObj.type" value="IN" />
                存款
            </label>
            <label class="text-red-900 text-lg w-1/2">
                <input type="radio" v-model="financeObj.type" value="OUT" />
                提領
            </label>
        </div>

        <div class="w-1/1 flex flex-col">
            <label class="label">日期:</label>
            <input type="date" class="input w-1/1" placeholder="" v-model="financeObj.date" />
        </div>

        <div class="w-1/1 flex flex-col">
            <label class="label">人員姓名:</label>
            <select class="select w-1/1" v-model="financeObj.code_name">
                <option v-for="(memObj, m_i) in members" :value="memObj.code_name">{{ memObj.name }}</option>
            </select>
        </div>

        <div class="w-1/1 flex flex-col">
            <label class="label">金額:</label>
            <input type="number" min="0" class="input w-1/1" placeholder="" v-model="financeObj.money" />
        </div>
        
        <div class="w-1/1 flex flex-col">
            <label class="label">備註:</label>
            <input type="text" class="input w-1/1" placeholder="" v-model="financeObj.memo" />
        </div>
    </div>

    <div class="divider divider-primary"></div>
    <div class="modal-action">
        <button class="btn bg-gray-900 text-gray-100 hover:bg-yellow-300 hover:text-gray-900 w-1/2" @click="closeSettingModal">
            關閉
        </button>
        <button class="btn bg-gray-200 text-gray-900 hover:bg-yellow-300 w-1/2" @click="newRecord">
            新增
        </button>
    </div>

</template>

<style scoped>

</style>
