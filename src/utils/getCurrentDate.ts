export const getCurrentDateWithGreeting = () => {
    const date = new Date();
    // const day = date.getDate();
    // const month = date.getMonth() + 1;
    // const year = date.getFullYear();
    const hours = date.getHours();
    let greeting;

    if (hours >= 6 && hours < 12) {
        greeting = "Buenos días";
    } else if (hours >= 12 && hours < 18) {
        greeting = "Buenas tardes";
    } else {
        greeting = "Buenas noches";
    }

    return `${greeting}`;
};