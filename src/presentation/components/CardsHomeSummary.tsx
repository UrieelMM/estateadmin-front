import React, { useEffect } from 'react';
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon, ScaleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { usePaymentSummaryStore } from '../../store/paymentSummaryStore';
import { Card } from "@heroui/react";
import { motion, AnimatePresence } from "framer-motion";
import { shallow } from "zustand/shallow";

const Tooltip: React.FC<{ text: string }> = ({ text }) => {
    const [show, setShow] = React.useState(false);
    return (
        <div
            className="relative inline-block"
            onMouseEnter={() => setShow(true)}
            onMouseLeave={() => setShow(false)}
        >
            <InformationCircleIcon className="w-5 h-5 text-default-500 cursor-pointer" />
            <AnimatePresence>
                {show && (
                    <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        transition={{ type: "tween", stiffness: 20, damping: 20 }}
                        style={{width: "200px", height:"50px"}}
                        className="absolute top-[20px] right-0 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-100 text-xs p-1 rounded z-10 w-16 whitespace-normal break-words flex text-center items-center shadow-[0_0_15px_rgba(79,70,229,0.3),0_0_250px_#8093e87b,0_0_100px_#c2abe6c5] dark:shadow-[0_0_50px_rgba(79,70,229,0.5),0_0_10px_#8093e8ac,0_0_100px_#c2abe6c1] cursor-pointer"
                    >
                        {text}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const CardsHomeSummary: React.FC = () => {
    const { 
        monthlyStats, 
        fetchSummary, 
        shouldFetchData,
        selectedYear,
        loading 
    } = usePaymentSummaryStore(
        (state) => ({
            monthlyStats: state.monthlyStats,
            fetchSummary: state.fetchSummary,
            shouldFetchData: state.shouldFetchData,
            selectedYear: state.selectedYear,
            loading: state.loading
        }),
        shallow
    );
    
    useEffect(() => {
        const loadDataIfNeeded = async () => {
            if (shouldFetchData(selectedYear)) {
                await fetchSummary(selectedYear);
            }
        };
        
        loadDataIfNeeded();
    }, [fetchSummary, shouldFetchData, selectedYear]);

    const currentMonth = (new Date().getMonth() + 1).toString().padStart(2, '0');
    const currentMonthStats = monthlyStats.find(stat => stat.month === currentMonth);
    
    const monthlyIncome = currentMonthStats?.paid || 0;
    const monthlyExpenses = currentMonthStats?.pending || 0;
    const ratio = monthlyIncome > 0 ? ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100 : 0;

    const formatCurrency = (value: number): string =>
        "$" + value.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });

    const cards = [
        {
            title: 'Ingresos del Mes',
            amount: monthlyIncome,
            tooltip: 'Total de ingresos registrados en el mes actual',
            icon: ArrowTrendingUpIcon,
            iconBackground: 'bg-green-500',
        },
        {
            title: 'Egresos del Mes',
            amount: monthlyExpenses,
            tooltip: 'Total de egresos registrados en el mes actual',
            icon: ArrowTrendingDownIcon,
            iconBackground: 'bg-red-500',
        },
        {
            title: 'Ratio Ingresos/Egresos',
            amount: ratio,
            isPercentage: true,
            tooltip: 'Porcentaje que representa la relación entre ingresos y egresos del mes actual',
            icon: ScaleIcon,
            iconBackground: 'bg-blue-500',
        },
    ];

    if (loading) {
        return (
            <div className="grid w-full grid-cols-1 gap-5 mb-8 sm:grid-cols-3">
                {[1, 2, 3].map((index) => (
                    <Card key={index} className="p-4 shadow-md rounded-md relative animate-pulse">
                        <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    </Card>
                ))}
            </div>
        );
    }

    return (
        <>
            <h2 className="text-xl font-bold mb-4">Estadísticas del mes actual</h2>
            <div className="grid w-full grid-cols-1 gap-5 mb-8 sm:grid-cols-3">
                {cards.map((card) => (
                    <Card key={card.title} className="p-4 shadow-md rounded-md relative">
                        <div className="absolute top-2 right-2">
                            <Tooltip text={card.tooltip} />
                        </div>
                        <div className="flex items-center mb-2">
                            <div className={`rounded-md p-2 ${card.iconBackground} mr-3`}>
                                <card.icon className="h-5 w-5 text-white" aria-hidden="true" />
                            </div>
                        </div>
                        <div className="flex flex-col gap-y-2">
                            <span className="text-sm font-medium text-default-500">
                                {card.title}:
                            </span>
                            <span className="text-2xl font-semibold text-default-700">
                                {card.isPercentage 
                                    ? `${ratio.toFixed(2)}%`
                                    : formatCurrency(card.amount)
                                }
                            </span>
                        </div>
                    </Card>
                ))}
            </div>
        </>
    );
};

export default CardsHomeSummary;
