<script setup>
    import { ref, reactive, onMounted, watch } from 'vue'
    import { fetchData } from "@/composables/fetchData"

    import SettingFinance from '@/components/SettingFinance.vue'

    const emit = defineEmits(['popupMessage']);
    const props = defineProps({
        title: String,
        account: String,
        user_role: String,
    });

    onMounted(() => {
        console.log("Finance mounted.");
        init();
    });

    let appState = ref("");
    let progressSetting = reactive({
        speed: {
            target: 0,
            speed: 0,
            perMonth: 0,
        },
    });
    let total_assets = ref(0);
    let deposit_TWD = ref(0);

    let house = reactive({
        remark: "",
        original:{
            unit_price: 0,
            price: 0,
        },
        now: {
            unit_price: 0,
            price: 0,
        }
    });

    let stock = reactive({
        totalValue: "",
        totalTWD: "",
        tw0056: {
            amount: 0,
            unit_price: 0,
            price: 0,
        },
    });

    let areaBlockStatus = reactive({
        speed: false,
        house: true,
        stock: false,
    });

    // 初始化 component
    function init(){
        console.log("finance.init");
        console.log("props.title=" + props.title);
        console.log("props.account=" + props.account);
        console.log("props.user_role=" + props.user_role);

        if(props.account){
            total_assets.value = 0;
            // 取得使用者個人 finance 資料
            fetchFinance();
        }
    }
    // 取得使用者個人 finance 資料
    function fetchFinance(){
        // 台股資訊
        {
            areaBlockStatus.stock = false;
            // 0056
            let fetchPromise_0056 = fetchData({
                api: "get_finance",
                data: {
                    account: props.account,
                    f_name: "stock_0056",
                }
            });
            let fetchPromise_price_0056 = fetchData({
                api: "get_answer",
                data: {
                    question: "台股ETF 0056 的股價, 只給我股價數字就好",
                }
            }, "AI");
            Promise.all([fetchPromise_0056, fetchPromise_price_0056]).then((values) => {
                console.log("台股資訊=", values);

                // 0056
                let finObj_0056 = values[0][0];
                // 0056 的即時股價
                {
                    let price_0056 = 0;
                    try
                    {
                        let jsonStr_ans = values[1].replace(/```json/g, "");
                        let jsonObj_ans = JSON.parse(jsonStr_ans);
                        price_0056 = parseFloat( jsonObj_ans["answer"] );
                    }
                    catch(ex){
                        price_0056 = 0;
                    }

                    finObj_0056["value2"] = price_0056;
                }

                let stockDatas_TWD = [finObj_0056];
                buildStock(stockDatas_TWD);
            });
        }

        // 台幣存款資訊
        {
            let fetchPromise_deposit = fetchData({
                api: "get_finance",
                data: {
                    account: props.account,
                    f_name: "deposit",
                }
            });
            Promise.all([fetchPromise_deposit]).then((values) => {
                console.log("台幣存款資訊=", values);
                buildDepositTWD(values[0][0]);
            });    
        }

        // 存款速度資訊
        {
            areaBlockStatus.speed = false;
            let fetchPromise_speed = fetchData({
                api: "get_finance",
                data: {
                    account: props.account,
                    f_name: "speed",
                }
            });
            Promise.all([fetchPromise_speed]).then((values) => {
                console.log("存款速度資訊=", values);
                buildSpeedBlock(values[0][0]);
            });
        }
        
        // 房屋資訊
        {
            areaBlockStatus.house = false;
            // house
            let fetchPromise_house = fetchData({
                api: "get_finance",
                data: {
                    account: props.account,
                    f_name: "house",
                }
            });
            let fetchPromise_unit_price = fetchData({
                api: "get_answer",
                data: {
                    question: "幫我找找'合恆寓紳鄰-曙光'的單坪價錢, 只給我單坪價錢數字就好",
                }
            }, "AI");
            Promise.all([fetchPromise_house, fetchPromise_unit_price]).then((values) => {
                console.log("房屋資訊=", values);

                // house
                let finObj_house = values[0][0];

                // 最新單坪價錢
                let now_unit_price = 0;
                {
                    try
                    {
                        let jsonStr_ans = values[1].replace(/```json/g, "");
                        let jsonObj_ans = JSON.parse(jsonStr_ans);

                        if(jsonObj_ans["answer"].indexOf("萬") >= 0){
                            now_unit_price = jsonObj_ans["answer"].replace(/萬/g, "").trim();
                        }else{
                            now_unit_price = jsonObj_ans["answer"].trim();
                        }
                        now_unit_price = parseFloat( now_unit_price ) * 10000;
                    }
                    catch(ex){
                        now_unit_price = 0;
                    }

                    console.log("最新單坪價錢=" + now_unit_price);
                }

                buildHouse(finObj_house, now_unit_price);

                areaBlockStatus.house = true;
            });
        }

    }
    // 建立"存款速度"區塊
    function buildSpeedBlock(depositData){
        //console.log("buildSpeedBlock.depositData=", depositData);

        let targetValue = 100 * 10000; // 目標: 存到 100 萬台幣的速度
        let twdValuePer3Month = parseInt( depositData["value1"] ); // 每期可以存到的台幣( 每期是 3 個月 )
        let stockValuePer3Month = parseInt( depositData["value2"] ); // 每期可以存到的股息( 每期是 3 個月 )
        let valuePerMonth = Math.floor( ( twdValuePer3Month + stockValuePer3Month ) / 3 ); // 每個月共可存到的台幣
        let valuePer3Month = ( twdValuePer3Month + stockValuePer3Month ); // 每期共可存到的台幣

        let speed = Math.ceil( targetValue / valuePer3Month );

        console.log("buildSpeedBlock.targetValue=" + targetValue);
        console.log("buildSpeedBlock.valuePer3Month=" + valuePer3Month);
        console.log("buildSpeedBlock.valuePerMonth=" + valuePerMonth);
        console.log("buildSpeedBlock.speed=" + speed);

        progressSetting["speed"]["target"] = Math.floor( targetValue / 10000 );
        progressSetting["speed"]["speed"] = speed;
        progressSetting["speed"]["perMonth"] = valuePerMonth; 
        progressSetting["speed"]["per3Month"] = valuePer3Month;
        progressSetting["speed"]["twdValuePer3Month"] = twdValuePer3Month;
        progressSetting["speed"]["stockValuePer3Month"] = stockValuePer3Month;

        areaBlockStatus.speed = true;
    }
    // 建立"台灣股票"區塊
    function buildStock(stockDatas){
        console.log("buildStock.stockDatas=", stockDatas);

        let stockTotalValue = 0;
        let stockTotalTWD = 0;
        let stockLabels = [];
        let stockSeries = [];
        stockDatas.forEach((dataObj, d_i) => {
            let name = dataObj["name"];
            let stockLabel = name.split("_")[1];

            stockLabels.push( stockLabel );
            stockSeries.push( dataObj["value1"] );

            stockTotalValue += dataObj["value1"];
            stockTotalTWD += (dataObj["value1"] * dataObj["value2"]);
            switch(dataObj["name"]){
                case "stock_0056":
                    stock.tw0056.amount = dataObj["value1"];
                    stock.tw0056.unit_price = dataObj["value2"];
                    stock.tw0056.price = Math.floor( dataObj["value1"] * dataObj["value2"] );
                    // 累計總資產
                    total_assets.value += Math.floor( dataObj["value1"] * dataObj["value2"] );
                    break;
            }
        });
        stock.totalValue = stockTotalValue
        stock.totalTWD = Math.floor( stockTotalTWD )

        areaBlockStatus.stock = true;
    }
    // 建立"台幣存款"區塊
    function buildDepositTWD(depositData){
        console.log("buildDepositTWD.depositData=", depositData);

        deposit_TWD.value = depositData["value1"];

        // 累計總資產
        total_assets.value += depositData["value1"];
    }
    // 建立"房屋資產"區塊
    function buildHouse(houseData, now_unit_price){
        console.log("buildHouse.houseData=", houseData);
        console.log("buildHouse.now_unit_price=", now_unit_price);

        house.remark = houseData.remark;
        house.original.price = houseData.value1;
        house.original.unit_price = houseData.value2;

        house.now.unit_price = now_unit_price;
        house.now.price = parseFloat( houseData.remark ) * house.now.unit_price;
    
        // 累計總資產
        total_assets.value += house.now.price;
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
            fetchFinance();
        }else if(opMode === "SAVE_FAIL"){
            emit('popupMessage', false, message); // Emitting the event with data
        }

        closeSettingModal();
    }

</script>

<template>

<div class="flex flex-col w-1/1 h-1/1 gap-2 overflow-y-auto">
    <!-- 編輯財務狀況 -->
    <div v-if="props.user_role === 'admin'" class="flex flex-row justify-end w-1/1 bg-transparent rounded-xl gap-2">
        <a class="text-gray-500 hover:text-gray-900 cursor-pointer fixed top-20 right-8 z-[50]" @click="openSettingModal">
            <svg class="size-10" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13v-2a1 1 0 0 0-1-1h-.757l-.707-1.707.535-.536a1 1 0 0 0 0-1.414l-1.414-1.414a1 1 0 0 0-1.414 0l-.536.535L14 4.757V4a1 1 0 0 0-1-1h-2a1 1 0 0 0-1 1v.757l-1.707.707-.536-.535a1 1 0 0 0-1.414 0L4.929 6.343a1 1 0 0 0 0 1.414l.536.536L4.757 10H4a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h.757l.707 1.707-.535.536a1 1 0 0 0 0 1.414l1.414 1.414a1 1 0 0 0 1.414 0l.536-.535 1.707.707V20a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-.757l1.707-.708.536.536a1 1 0 0 0 1.414 0l1.414-1.414a1 1 0 0 0 0-1.414l-.535-.536.707-1.707H20a1 1 0 0 0 1-1Z"/>
                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/>
            </svg>
        </a>
    </div>

    <!-- 總資產 -->
    <div class="card bg-green-300 rounded-box grid h-3/10 w-10/10 p-5 place-items-center">
        <div class="w-1/1 text-2xl text-center">總資產= NTD$ {{ new Intl.NumberFormat('en-US').format(total_assets) }}</div>
    </div>

    <div class="divider">( NTD 計價 )</div>
    <!-- 存款 -->
    <div class="card bg-base-300 rounded-box grid h-3/10 w-10/10 p-5 place-items-center">
        <div class="w-1/1 text-2xl text-center">現金=NTD$ {{ new Intl.NumberFormat('en-US').format(deposit_TWD) }}</div>
    </div>

    <!-- 房屋價值 -->
    <div v-if="areaBlockStatus.house" class="card bg-gray-300 rounded-box grid h-10/10 w-10/10 p-5 place-items-start mt-1">
        <span class="text-2xl w-1/1 underline text-center"
              :class="{ 'bg-green-300': house.now.price > house.original.price, 
                        'bg-transparent': house.now.price === house.original.price,
                        'bg-red-300': house.now.price < house.original.price }">
            房屋價值
        </span>
        <span class="text-xl w-1/1">
            增加價值: NTD$ {{ new Intl.NumberFormat('en-US').format( house.now.price - house.original.price ) }} 
        </span>

        <br />

        <span class="text-xl w-1/1">
            現有價值: NTD$ {{ new Intl.NumberFormat('en-US').format( house.now.price ) }} 
        </span>
        <span class="text-lg">
            現有單價: NTD$ {{ house.now.unit_price / 10000 }} 萬
        </span>
        
        <br />
        <span class="text-lg">坪數: {{ house.remark }}</span>
        <br />
        
        <span class="text-lg">
            購買價值: NTD$ {{ new Intl.NumberFormat('en-US').format( house.original.price ) }}
        </span>
        <span class="text-lg">
            購買單價: NTD$ {{ house.original.unit_price / 10000 }} 萬
        </span>
    </div>
    <div v-if="!areaBlockStatus.house" class="skeleton h-32 w-1/1"></div>

    <!-- 股票價值 -->
    <div class="divider">股票</div>
    <div class="flex flex-col md:flex-row w-1/1 h-1/1 gap-2">
        <div class="bg-base-300 rounded-box flex flex-col p-5 h-10/10 w-1/1 md:w-1/2 items-center">
            <span v-if="areaBlockStatus.stock" class="h-1/1 inline-block align-middle">
                <span class="text-2xl">總價值=NTD$ {{ new Intl.NumberFormat('en-US').format(stock.totalTWD) }}</span>
            </span>
            <div v-if="!areaBlockStatus.stock" class="skeleton h-32 w-1/1"></div>
        </div>
        <div class="h-1/1 flex content-center hidden md:block">
            <div>=</div>
        </div>
        <div class="flex flex-row gap-1 w-1/1">
            <div v-if="areaBlockStatus.stock" class="card bg-gray-300 rounded-box grid p-5 h-1/1 w-1/1 place-items-start">
                <span class="text-2xl underline w-1/1 text-center">0056 </span> 
                <span class="text-lg">股數: {{ new Intl.NumberFormat('en-US').format(stock.tw0056.amount) }}</span>
                <span class="text-lg">單價(NTD): {{ new Intl.NumberFormat('en-US').format(stock.tw0056.unit_price) }}</span>
                <span class="text-lg">股數 x 單價 = NTD$ {{ new Intl.NumberFormat('en-US').format(stock.tw0056.price) }}</span>
            </div>
            <div v-if="!areaBlockStatus.stock" class="skeleton h-32 w-1/1"></div>
        </div>
    </div>

    <!-- 存款速度 -->
    <div class="divider">存款速度</div>
    <div class="flex flex-col w-1/1 gap-2">
        <div class="flex flex-row w-1/1 h-1/1">
            <div v-if="areaBlockStatus.speed" class="card rounded-box grid h-1/1 w-1/1 p-5 place-items-center"
                 :class="{'bg-red-300': 12 <= progressSetting.speed.speed,
                          'bg-orange-300': 7 <= progressSetting.speed.speed && progressSetting.speed.speed < 12,
                          'bg-blue-300': 3 < progressSetting.speed.speed && progressSetting.speed.speed < 7,
                          'bg-green-300': progressSetting.speed.speed <= 3}">
                <div class="w-1/1 text-xl text-center">
                    約需 {{ progressSetting["speed"]["speed"] }} 期<br />
                    可以存到 {{ new Intl.NumberFormat('en-US').format(progressSetting["speed"]["target"]) }} 萬
                </div>
            </div>
            <div v-if="!areaBlockStatus.speed" class="skeleton h-32 w-1/1"></div>
        </div>
        <div class="flex flex-col md:flex-row w-10/10 h-10/10 gap-2">        
            <div v-if="areaBlockStatus.speed" class="card rounded-box grid h-1/1 w-1/1 md:w-1/2 p-5 place-items-center"
                 :class="{'bg-red-300': 12 <= progressSetting.speed.speed,
                          'bg-orange-300': 7 <= progressSetting.speed.speed && progressSetting.speed.speed < 12,
                          'bg-blue-300': 3 < progressSetting.speed.speed && progressSetting.speed.speed < 7,
                          'bg-green-300': progressSetting.speed.speed <= 3}">
                <div class="w-10/10 text-xl text-center">
                    每期(薪資+股利)約可存<br />
                    NTD ${{ new Intl.NumberFormat('en-US').format(progressSetting["speed"]["per3Month"]) }}
                </div>
                <div v-if="!areaBlockStatus.speed" class="skeleton h-32 w-1/1"></div>
            </div>
            <div class="h-1/1 flex content-center hidden md:block">
                <div>=</div>
            </div>
            <div class="flex flex-row w-1/1 md:w-1/2 gap-2">
                <div class="card rounded-box grid h-1/1 w-1/2 p-5 place-items-center bg-base-300 ">
                    <div v-if="areaBlockStatus.speed" class="w-10/10 text-md text-center">
                        每期(薪資)約可存<br />
                        NTD ${{ new Intl.NumberFormat('en-US').format(progressSetting["speed"]["twdValuePer3Month"]) }}
                    </div>
                    <div v-if="!areaBlockStatus.speed" class="skeleton h-32 w-1/1"></div>
                </div>
                <div class="h-1/1 flex items-center">
                    <div>+</div>
                </div>
                <div class="card rounded-box grid h-1/1 w-1/2 p-5 place-items-center bg-base-300 ">
                    <div v-if="areaBlockStatus.speed" class="w-10/10 text-md text-center">
                        每期(股利)約可存<br />
                        NTD ${{ progressSetting["speed"]["stockValuePer3Month"] }}
                    </div>
                    <div v-if="!areaBlockStatus.speed" class="skeleton h-32 w-1/1"></div>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- setting modal -->
<dialog id="settingModal" class="modal">
    <div class="modal-box h-9/10 w-1/1 flex flex-col bg-neutral-100">
        <SettingFinance :title="props.title" :account="props.account" @modal-status="modalStatus" />
    </div>
</dialog>

</template>

<style scoped>

</style>
