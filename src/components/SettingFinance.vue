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

    let finance = reactive({
        house: {
            target: 0,
        },
        credit: {
            target: 0,
            remain: 0,
        },
        deposit_Speed:{
            value1: 0,
            value2: 0,
        },
        deposit_TWD:{
            value: 0,
        },
        deposit_USD_insurance:{
            value: 0,
            currency: 0,
        },
        deposit_USD_fixed:{
            value: 0,
            currency: 0,
        },
        stock_nano:{
            value: 0,
            currency: 0,
        },
        stock_tw0056: {
            num: 0,
            price: 0,
        },
        stock_tw00878: {
            num: 0,
            price: 0,
        },
        stock_tw00919: {
            num: 0,
            price: 0,
        },
    });

    // 初始化 component
    function init(){
        console.log("Setting_Finance.init");
        console.log("props.app_state", props.app_state);
        console.log("props.title", props.title);
        console.log("props.account", props.account);

        fetchFinance();
    }
    // 取得使用者個人 finance 資料
    function fetchFinance(){
        let fetchFinancePromise = fetchData({
            api: "get_finance",
            data: {
                account: props.account,
                f_name: "All",
            }
        });
        Promise.all([fetchFinancePromise]).then((values) => {
            console.log("fetchFinancePromise.values=", values);

            values[0].forEach((finObj, fin_i) => {
                if(finObj["name"] === "house"){
                    // 購屋資訊
                    finance.house.target = finObj["value1"];
                } else if(finObj["name"] === "credit"){
                    // 信貸資訊
                    finance.credit.target = finObj["value1"];
                    finance.credit.remain = finObj["value2"];
                } else if(finObj["name"] === "stock_0056"){
                    // 台股資訊
                    finance.stock_tw0056.num = finObj["value1"];
                    finance.stock_tw0056.price = 0;
                } else if(finObj["name"] === "stock_00878"){
                    // 台股資訊
                    finance.stock_tw00878.num = finObj["value1"];
                    finance.stock_tw00878.price = 0;
                } else if(finObj["name"] === "stock_00919"){
                    // 台股資訊
                    finance.stock_tw00919.num = finObj["value1"];
                    finance.stock_tw00919.price = 0;
                } else if(finObj["name"] === "stock_nano"){
                    // 奈米投資訊
                    finance.stock_nano.value = finObj["value1"];
                    finance.stock_nano.currency = 0;
                } else if(finObj["name"] === "speed"){
                    // 台幣存款速度
                    finance.deposit_Speed.value1 = finObj["value1"];
                    finance.deposit_Speed.value2 = finObj["value2"];
                } else if(finObj["name"] === "deposit" && finObj["currency"] === "TWD"){
                    // 台幣存款資訊
                    finance.deposit_TWD.value = finObj["value1"];
                } else if(finObj["name"] === "deposit_insurance" && finObj["currency"] === "USD"){
                    // 美金存款資訊 - 保險
                    finance.deposit_USD_insurance.value = finObj["value1"];
                    finance.deposit_USD_insurance.currency = 0;
                } else if(finObj["name"] === "deposit_fixed" && finObj["currency"] === "USD"){
                    // 美金存款資訊 - 定存
                    finance.deposit_USD_fixed.value = finObj["value1"];
                    finance.deposit_USD_fixed.currency = 0;
                }
            });
        });
    }
    // 儲存 finance 設定資料
    function saveFinance(){
        console.log("saveFinance.finance=", finance);

        let saveFinancePromise = fetchData({
            api: "save_finance",
            data: {
                finance: finance,
                account: props.account,
            }
        });
        Promise.all([saveFinancePromise]).then((values) => {
            console.log("saveFinancePromise.values=", values);

            let opObj = {
                status: true,
                message: "",
            };
            opObj.status = values[0]["result"];
            if(values[0]["result"] === true){
                opObj.message = "儲存成功";
            }else{
                opObj.message = values[0]["message"];
            }
            // 將 message 傳給 Setting.vue 

            if(opObj.status){
                // 通知 Finance.vue 儲存成功, 並關閉 SettingFinance Modal
                emit('modalStatus', "SAVE_SUCCESS", opObj.message); // Emitting the event with data
            }else{
                // 通知 Finance.vue 儲存失敗, 並關閉 SettingFinance Modal
                emit('modalStatus', "SAVE_FAIL", opObj.message); // Emitting the event with data
            }
        });
    }   
    // 關閉 setting modal
    function closeSettingModal(){
        // 通知 Finance.vue 關閉 SettingFinance Modal
        emit('modalStatus', "CLOSE", ""); // Emitting the event with data
    }
</script>

<template>

    <div class="w-1/1 flex flex-col overflow-y-auto">
        <div class="divider divider-warning">
            買房
        </div>
        <div class="w-1/1 flex flex-row gap-2">
            <label class="label flex-none">目標房價:</label>
            <input type="number" min="0" class="input flex-1" placeholder="0" v-model="finance.house.target" />
        </div>

        <div class="divider divider-error">
            台新信貸
        </div>
        <div class="w-1/1 flex flex-row gap-2">
            <label class="label flex-none">剩餘款項:</label>
            <input type="number" min="0" class="input flex-1" placeholder="0" v-model="finance.credit.remain" />
        </div>

        <div class="divider divider-success">
            存款速度( 以 3 個月為一期 )
        </div>
        <div class="w-1/1 flex flex-col md:flex-row">
            <div class="w-1/1 md:w-1/2 flex flex-row gap-1">
                <label class="label flex-none">台幣/期:</label>
                <input type="number" min="0" class="input flex-1" placeholder="0" v-model="finance.deposit_Speed.value1" />
            </div>
            <div class="w-1/1 md:w-1/2 flex flex-row gap-1">
                <label class="label flex-none">股息/期:</label>
                <input type="number" min="0" class="input flex-1" placeholder="0" v-model="finance.deposit_Speed.value2" />
            </div>
        </div>

        <div class="divider divider-success">
            存款
        </div>
        <div class="w-1/1 flex flex-row gap-2">
            <label class="label flex-none">存款( TWD )</label>
            <input type="number" min="0" class="input flex-1" placeholder="0" v-model="finance.deposit_TWD.value" />
        </div>

        <div class="divider"></div>
        <div class="w-1/1 flex flex-row gap-1">
            <label class="label flex-none">保險( USD ):</label>
            <input type="number" min="0" class="input flex-1" placeholder="0" v-model="finance.deposit_USD_insurance.value" />
        </div>
        <div class="w-1/1 flex flex-row gap-1">
            <label class="label flex-none">定存( USD ):</label>
            <input type="number" min="0" class="input flex-1" placeholder="0" v-model="finance.deposit_USD_fixed.value" />
        </div>

        <div class="divider divider-neutral">
            存股: 0056.TW
        </div>
        <div class="w-1/1 flex flex-row gap-1">
            <label class="label flex-none">股數:</label>
            <input type="number" min="0" class="input flex-1" placeholder="0" v-model="finance.stock_tw0056.num" />
        </div>

        <div class="divider divider-neutral">
            存股: 00878.TW
        </div>
        <div class="w-1/1 flex flex-row gap-1">
            <label class="label flex-none">股數:</label>
            <input type="number" min="0" class="input flex-1" placeholder="0" v-model="finance.stock_tw00878.num" />
        </div>

        <div class="divider divider-neutral">
            奈米投
        </div>
        <div class="w-1/1 flex flex-row gap-1">
            <label class="label flex-none">USD</label>
            <input type="number" min="0" class="input flex-1" placeholder="0" v-model="finance.stock_nano.value" />
        </div>
    </div>
    <div class="divider divider-primary"></div>
    <div class="w-1/1 flex flex-row gap-2">
        <button class="btn bg-gray-900 text-gray-100 hover:bg-blue-200 hover:text-gray-900 w-1/2 " @click="closeSettingModal">
            關閉
        </button>
        <button class="btn bg-gray-100 text-gray-900 hover:bg-blue-200 w-1/2" @click="saveFinance">
            儲存
        </button>
    </div>

</template>

<style scoped>

</style>
