import { ref, onMounted, onUnmounted } from 'vue'

// by convention, composable function names start with "use"
export function getRandomNumber(min = 1, max = 1) {
    // a composable can also hook into its owner component's
    // lifecycle to setup and teardown side effects.
    /*
    onMounted(() => {

    });

    onUnmounted(() => {

    });
    */
    // Example using window.crypto.getRandomValues() for cryptographically secure random numbers
    const array = new Uint32Array(1);
    window.crypto.getRandomValues(array);
    const secureRandomNumber = array[0] / (2**32); // Normalize to a float between 0 and 1

    return Math.floor(secureRandomNumber * (max - min + 1)) + min;
}