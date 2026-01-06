<script setup>
    import { ref, reactive, onMounted } from 'vue'
    import moment from 'moment'
    import { fetchData } from "@/composables/fetchData"

    const props = defineProps({
        title: String,
        account: String,
        funSetting: Object,
    })

    onMounted(() => {
        console.log("Rule mounted.");
        init();
    });

    let appState = ref("");
    let bankInfo = reactive({
        bank_no: "",
        account: "",
    });
    let fileInfo = reactive({
        file_name: "",
        link: "",
    })

    // 初始化 component
    function init(){
        console.log("Rule.init");
        console.log("Rule.props.title", props.title);
        console.log("Rule.props.account", props.account);
        console.log("Rule.props.funSetting", props.funSetting);

        bankInfo.bank_no = props.funSetting.bank_info.value1;
        bankInfo.account = props.funSetting.bank_info.value2;

        fileInfo.file_name = props.funSetting.file_info.value1;
        fileInfo.link = props.funSetting.file_info.value2;
    }    
    
</script>

<template>

<div class="w-1/1 h-1/1 flex flex-col gap-2 overflow-y-auto">
    <div class="w-1/1">
        <ul class="list bg-base-100 rounded-box shadow-md">
            <li class="p-4 pb-2 text-base opacity-80 tracking-wide bg-green-200 z-10 font-black" style="position: sticky; top: 0px;">
                基金資訊
            </li>

            <li class="list-row">
                <div>
                    <svg class="size-10 text-gray-800" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                        <path stroke="currentColor" stroke-linecap="round" stroke-width="2" d="M3 21h18M4 18h16M6 10v8m4-8v8m4-8v8m4-8v8M4 9.5v-.955a1 1 0 0 1 .458-.84l7-4.52a1 1 0 0 1 1.084 0l7 4.52a1 1 0 0 1 .458.84V9.5a.5.5 0 0 1-.5.5h-15a.5.5 0 0 1-.5-.5Z"/>
                    </svg>
                </div>
                <div class="list-col-grow">
                    <div>管理帳戶 - Line Bank - 友感帳戶</div>
                    <div class="text-xs uppercase font-semibold opacity-60">銀行代號: {{ bankInfo.bank_no }} / 帳號: {{ bankInfo.account }}</div>
                </div>
            </li>

            <li class="list-row">
                <div>
                    <svg class="size-10 text-gray-800" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                        <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 18h14M5 18v3h14v-3M5 18l1-9h12l1 9M16 6v3m-4-3v3m-2-6h8v3h-8V3Zm-1 9h.01v.01H9V12Zm3 0h.01v.01H12V12Zm3 0h.01v.01H15V12Zm-6 3h.01v.01H9V15Zm3 0h.01v.01H12V15Zm3 0h.01v.01H15V15Z"/>
                    </svg>
                </div>
                <div class="list-col-grow">
                    <div>2025年11月起, 月費: NTD$ 500</div>
                    <div class="text-xs uppercase font-semibold opacity-60">
                        依 2025/10/05(日) 中秋烤肉活動討論決議 
                    </div>
                </div>
            </li>

            <li class="list-row">
                <div>
                    <svg class="size-10 text-gray-800" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                        <path fill-rule="evenodd" d="M10 5a2 2 0 0 0-2 2v3h2.4A7.48 7.48 0 0 0 8 15.5a7.48 7.48 0 0 0 2.4 5.5H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h1V7a4 4 0 1 1 8 0v1.15a7.446 7.446 0 0 0-1.943.685A.999.999 0 0 1 12 8.5V7a2 2 0 0 0-2-2Z" clip-rule="evenodd"/>
                        <path fill-rule="evenodd" d="M10 15.5a5.5 5.5 0 1 1 11 0 5.5 5.5 0 0 1-11 0Zm6.5-1.5a1 1 0 1 0-2 0v1.5a1 1 0 0 0 .293.707l1 1a1 1 0 0 0 1.414-1.414l-.707-.707V14Z" clip-rule="evenodd"/>
                    </svg>
                </div>
                <div class="list-col-grow">
                    <div>月費儲值期限: <span class="text-red-900 font-black text-base">每月 10 號</span></div>
                    <div class="text-xs uppercase font-semibold opacity-60">
                        每戶代表人請於每月 10 號前儲值月費。

                        <div class="mt-5">
                            * 額外說明: 
                            <ul>
                                <li>1. 期限日期可再討論</li>
                                <li>2. 儲值方式請見最下方說明</li>
                                <li>3. 可多人合併儲值( 為了資料完整性，合併時，請主動告知。 )</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </li>

            <li class="list-row">
                <div>
                    <svg class="size-10 text-gray-800" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                        <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.35709 16V5.78571c0-.43393.34822-.78571.77777-.78571H18.5793c.4296 0 .7778.35178.7778.78571V16M5.35709 16h-1c-.55229 0-1 .4477-1 1v1c0 .5523.44771 1 1 1H20.3571c.5523 0 1-.4477 1-1v-1c0-.5523-.4477-1-1-1h-1M5.35709 16H19.3571M9.35709 8l2.62501 2.5L9.35709 13m4.00001 0h2"/>
                    </svg>
                </div>
                <div class="list-col-grow">
                    <div>儲值資料彙整: <span class="text-blue-900 font-black text-base">每月 12 號</span></div>
                    <div class="text-xs uppercase font-semibold opacity-60">
                        輪值代管人於每月 12 號前進行當月份儲值資料彙整，並公告於共享檔案(PDF)、公佈欄網站和 Line 群組"跟著家族去旅行"。
                    </div>
                </div>
            </li>

            <li class="list-row">
                <div>
                    <svg class="size-10 text-gray-800" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                        <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 17v-5h1.5a1.5 1.5 0 1 1 0 3H5m12 2v-5h2m-2 3h2M5 10V7.914a1 1 0 0 1 .293-.707l3.914-3.914A1 1 0 0 1 9.914 3H18a1 1 0 0 1 1 1v6M5 19v1a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-1M10 3v4a1 1 0 0 1-1 1H5m6 4v5h1.375A1.627 1.627 0 0 0 14 15.375v-1.75A1.627 1.627 0 0 0 12.375 12H11Z"/>
                    </svg>
                </div>
                <div class="list-col-grow">
                    <div>管理工具 1. 共享檔案(PDF)</div>
                    <div class="text-xs font-semibold opacity-60">詳細記載儲值細項、提領細項(包含日期、目的和收據照片)</div>
                    <div class="divider"></div>
                    <div class="text-xs font-semibold opacity-60">檔案名稱: {{ fileInfo.file_name }}</div>
                    <div class="text-xs font-semibold opacity-60">共享連結: <a class="link" target="_blank" :href="fileInfo.link">{{ fileInfo.link }}</a></div>
                </div>
            </li>

            <li class="list-row">
                <div>
                    <svg class="size-10 text-gray-800" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                        <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 14H4m6.5 3L8 20m5.5-3 2.5 3M4.88889 17H19.1111c.4909 0 .8889-.4157.8889-.9286V4.92857C20 4.41574 19.602 4 19.1111 4H4.88889C4.39797 4 4 4.41574 4 4.92857V16.0714c0 .5129.39797.9286.88889.9286ZM13 14v-3h4v3h-4Z"/>
                    </svg>
                </div>
                <div class="list-col-grow">
                    <div>管理工具 2. 公佈欄網站</div>
                    <div class="text-xs font-semibold opacity-60">方便查詢儲值、提領等款項、管理方式，以及<del>活動公告</del>等細節</div>
                </div>
            </li>

            <li class="list-row">
                <div>
                    <svg class="size-10 text-gray-800" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                        <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 10.5h.01m-4.01 0h.01M8 10.5h.01M5 5h14a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1h-6.6a1 1 0 0 0-.69.275l-2.866 2.723A.5.5 0 0 1 8 18.635V17a1 1 0 0 0-1-1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z"/>
                    </svg>
                </div>
                <div class="list-col-grow">
                    <div>管理工具 3. Line 群組"跟著家族去旅行"</div>
                    <div class="text-xs font-semibold opacity-60">各項資訊即時通知</div>
                </div>
            </li>


            <li class="list-row">
                <div>
                    <svg class="size-10 text-gray-800" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                        <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.5713 5h7v9h-7m-6.00001-4-3 4.5m3-4.5v5m0-5h3.00001m0 0h5m-5 0v5m-3.00001 0h3.00001m-3.00001 0v5m3.00001-5v5m6-6 2.5 6m-3-6-2.5 6m-3-14.5c0 .82843-.67158 1.5-1.50001 1.5-.82843 0-1.5-.67157-1.5-1.5s.67157-1.5 1.5-1.5 1.50001.67157 1.50001 1.5Z"/>
                    </svg>
                </div>
                <div class="list-col-grow">
                    <div>輪值代管人資訊</div>
                    <div class="text-xs font-semibold opacity-60">期間: {{ funSetting.agent.term }}</div>
                    <div class="text-xs font-semibold opacity-60">姓名: {{ funSetting.agent.name }}</div>
                    <div class="text-xs font-semibold opacity-60">電話: {{ funSetting.agent.phone }}</div>
                    <div class="text-xs font-semibold opacity-60">Line ID: {{ funSetting.agent.lineID }}</div>
                </div>
            </li>
        </ul>
    </div>

    <div class="w-1/1">
        <ul class="list bg-base-100 rounded-box shadow-md">
            <li class="p-4 pb-2 text-base opacity-80 tracking-wide bg-yellow-200 font-black z-10" style="position: sticky; top: 0px;">
                月費儲值方式
            </li>
  
            <li class="list-row">
                <div class="text-4xl font-thin opacity-30 tabular-nums">01</div>
                <div>
                    <svg class="size-10 text-gray-800" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                        <path fill-rule="evenodd" d="M4 3a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h1v2a1 1 0 0 0 1.707.707L9.414 13H15a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1H4Z" clip-rule="evenodd"/>
                        <path fill-rule="evenodd" d="M8.023 17.215c.033-.03.066-.062.098-.094L10.243 15H15a3 3 0 0 0 3-3V8h2a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1h-1v2a1 1 0 0 1-1.707.707L14.586 18H9a1 1 0 0 1-.977-.785Z" clip-rule="evenodd"/>
                    </svg>
                </div>
                <div class="list-col-grow">
                    <div class="text-base">加入"Line Bank - 友感帳戶"群組</div>
                    <div class="list-col-wrap text-xs">
                        <span class="text-blue-900 font-black">* 最推薦的方式: 方便 / 透明 / 節省轉帳手續費</span>

                        <div class="mt-5">
                            * 參考資料: 
                            <a class="link" target="_blank" href="https://corp.linebank.com.tw/blog/6659d8fb-8a09-455b-9124-494454c9772f">Line Bank - 友感帳戶</a>
                        </div>
                    </div>
                </div>
            </li>

            <li class="list-row">
                <div class="text-4xl font-thin opacity-30 tabular-nums">02</div>
                <div>
                    <svg class="size-10 text-gray-800" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                        <path fill-rule="evenodd" d="M3 5.983C3 4.888 3.895 4 5 4h14c1.105 0 2 .888 2 1.983v8.923a1.992 1.992 0 0 1-2 1.983h-6.6l-2.867 2.7c-.955.899-2.533.228-2.533-1.08v-1.62H5c-1.105 0-2-.888-2-1.983V5.983Zm5.706 3.809a1 1 0 1 0-1.412 1.417 1 1 0 1 0 1.412-1.417Zm2.585.002a1 1 0 1 1 .003 1.414 1 1 0 0 1-.003-1.414Zm5.415-.002a1 1 0 1 0-1.412 1.417 1 1 0 1 0 1.412-1.417Z" clip-rule="evenodd"/>
                    </svg>
                </div>
                <div class="list-col-grow">
                    <div class="text-base">使用"Line App 中的 Line Pay Money"進行"跨機構轉帳"或"轉帳"</div>
                    <div class="list-col-wrap text-xs mt-3">
                        <span class="underline text-blue-900">&nbsp;跨機構轉帳&nbsp;</span> <br />
                        使用 Line Pay Money 將月費直接轉進管理帳戶, 可能需自行負擔轉帳手續費。<br />
                        <br />
                        <span class="underline text-blue-900">&nbsp;轉帳&nbsp;</span> <br />
                        使用 Line Pay Money 將月費轉進輪值代管人的 Line Pay Money 中, 再由輪值代管人轉進管理帳戶。
                    </div>
                </div>
            </li>
            
            <li class="list-row">
                <div class="text-4xl font-thin opacity-30 tabular-nums">03</div>
                <div>
                    <svg class="size-10 text-gray-800" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                        <path fill-rule="evenodd" d="M3 5.983C3 4.888 3.895 4 5 4h14c1.105 0 2 .888 2 1.983v8.923a1.992 1.992 0 0 1-2 1.983h-6.6l-2.867 2.7c-.955.899-2.533.228-2.533-1.08v-1.62H5c-1.105 0-2-.888-2-1.983V5.983Zm5.706 3.809a1 1 0 1 0-1.412 1.417 1 1 0 1 0 1.412-1.417Zm2.585.002a1 1 0 1 1 .003 1.414 1 1 0 0 1-.003-1.414Zm5.415-.002a1 1 0 1 0-1.412 1.417 1 1 0 1 0 1.412-1.417Z" clip-rule="evenodd"/>
                    </svg>
                </div>
                <div class="list-col-grow">
                    <div class="text-base">使用"iPass Money App"進行"跨機構轉帳"或"轉帳"</div>
                    <div class="list-col-wrap text-xs mt-3">
                        <span class="underline text-blue-900">&nbsp;跨機構轉帳&nbsp;</span> <br />
                        使用 iPass Money 將月費直接轉進管理帳戶, 可能需自行負擔轉帳手續費。<br>
                        <br />
                        <span class="underline text-blue-900">&nbsp;轉帳&nbsp;</span> <br />
                        使用 iPass Money 將月費轉進輪值代管人的 iPass Money 中, 再由輪值代管人轉進管理帳戶。
                    </div>
                </div>
            </li>
  
            <li class="list-row">
                <div class="text-4xl font-thin opacity-30 tabular-nums">04</div>
                <div>
                    <svg class="size-10 text-gray-800" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                        <path fill-rule="evenodd" d="M10.915 2.345a2 2 0 0 1 2.17 0l7 4.52A2 2 0 0 1 21 8.544V9.5a1.5 1.5 0 0 1-1.5 1.5H19v6h1a1 1 0 1 1 0 2H4a1 1 0 1 1 0-2h1v-6h-.5A1.5 1.5 0 0 1 3 9.5v-.955a2 2 0 0 1 .915-1.68l7-4.52ZM17 17v-6h-2v6h2Zm-6-6h2v6h-2v-6Zm-2 6v-6H7v6h2Z" clip-rule="evenodd"/>
                        <path d="M2 21a1 1 0 0 1 1-1h18a1 1 0 1 1 0 2H3a1 1 0 0 1-1-1Z"/>
                    </svg>
                </div>
                <div class="list-col-grow">
                    <div class="text-base">以常用銀行帳戶, 直接轉帳進管理帳戶</div>
                    <div class="list-col-wrap text-xs">
                        可能需自行負擔轉帳手續費。
                    </div>
                </div>
            </li>
            
        </ul>

    </div>

    <div class="divider"></div>
</div>

</template>

<style scoped>

</style>
