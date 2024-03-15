import { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions 
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// eslint-disable-next-line react-refresh/only-export-components
export const options: ChartOptions<'bar'> = {
  responsive: true,
  plugins: {
    legend: {
      position: 'top',
    },
    title: {
      display: true,
      text: 'Relación de ingresos por mes en el año actual y anterior',
    },
  },
};

const ChartHome = () => {
  const [valuesActually, setValuesActually] = useState<number[]>([]);
  const [valuesPrevious, setValuesPrevious] = useState<number[]>([]);

  const labels = [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Setiembre',
    'Octubre',
    'Noviembre',
    'Diciembre',
  ];

  // Simulando datos para el año actual
  const dataActually = () => {
    // Supongamos que estos son valores promedio de compra por mes en 2022
    const data = [120, 150, 100, 130, 200, 230, 170, 160, 180, 190, 210, 220];
    setValuesActually(data);
  };

  // Simulando datos para el año anterior
  const dataPrevious = () => {
    // Supongamos que estos son valores promedio de compra por mes en 2023
    const data = [110, 140, 90, 120, 190, 220, 160, 150, 170, 180, 200, 210];
    setValuesPrevious(data);
  };

  useEffect(() => {
    dataActually();
    dataPrevious();
  }, []);

  const data = {
    labels,
    datasets: [
      {
        label: '2022',
        data: valuesActually,
        backgroundColor: '#bacafd',
      },
      {
        label: '2023',
        data: valuesPrevious,
        backgroundColor: '#8d8ff3',
      },
    ],
  };

  return (
    <section className="w-full shadow-lg rounded-md mt-12">
      <div>
        <p className="text-xl font-bold text-center">Balance general</p>
      </div>
      <Bar data={data} options={options} />
    </section>
  );
};

export default ChartHome;
