import { ref, onMounted, onUnmounted } from 'vue'

// by convention, composable function names start with "use"
export function fetchData(postData, api_position = "MAIN") {
    // a composable can also hook into its owner component's
    // lifecycle to setup and teardown side effects.
    /*
    onMounted(() => {

    });

    onUnmounted(() => {

    });
    */

    let fetchDataPromise = new Promise((resolve, reject) => {
        let cloudRunUrl = "";
        switch(api_position){
            case "MAIN": cloudRunUrl = import.meta.env.VITE_API_URL; break;
            case "AI": cloudRunUrl = import.meta.env.VITE_AI_API_URL; break;
            case "KUO-FUNDS": cloudRunUrl = import.meta.env.VITE_KUO_FUNDS_API_URL; break;
        }

        $("#loading").show();

        fetch(cloudRunUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json' // 設定內容類型為 JSON
            },
            body: JSON.stringify(postData) // 將 JavaScript 物件轉換為 JSON 字串
        })
        .then(response => {
            //console.log("response=", response);
            if (!response.ok) {
                reject(`HTTP error! status: ${response.status}`);
            }

            // 解析 JSON 格式的回應
            return response.json();
        })
        .then(data => {
            setTimeout(() => {
                $("#loading").hide();
            }, 1000);

            //console.log('Success:', data);
            resolve(data);
        })
        .catch(error => {
            setTimeout(() => {
                $("#loading").hide();
            }, 1000);

            console.error('Error:', error);
            reject('Error:' + error);
        });
    });

    return fetchDataPromise;
}