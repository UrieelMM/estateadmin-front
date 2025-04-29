export const getCurrentDateWithGreeting = (isDarkMode: boolean = false) => {
    const date = new Date();
    // const day = date.getDate();
    // const month = date.getMonth() + 1;
    // const year = date.getFullYear();
    const hours = date.getHours();
    let greeting;
    let emoji;

    if (hours >= 6 && hours < 12) {
        greeting = "Buenos días";
        emoji = isDarkMode ? "☀️" : "☀️";
    } else if (hours >= 12 && hours < 18) {
        greeting = "Buenas tardes";
        emoji = isDarkMode ? "🌙" : "🌠";
    } else {
        greeting = "Buenas noches";
        emoji = isDarkMode ? "🌙" : "🌙";
    }

    return `${greeting} ${emoji}`;
};