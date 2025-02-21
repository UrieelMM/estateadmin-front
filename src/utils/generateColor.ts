const indigoTones = [
    "bg-indigo-400",
    "bg-indigo-500",
  ];
export const getRandomIndigoTone = () => {
    const randomIndex = Math.floor(Math.random() * indigoTones.length);
    return indigoTones[randomIndex];
};
