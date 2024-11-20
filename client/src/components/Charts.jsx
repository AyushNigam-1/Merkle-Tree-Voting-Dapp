import React from 'react'
import { Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);
const Charts = ({ gasUsed, timetaken, blocksize }) => {
    console.log(gasUsed, timetaken, blocksize)
    const size = {
        labels: ['V1', 'V2'],
        datasets: [
            {
                label: 'Block Size',
                data: blocksize,
                backgroundColor: 'rgba(75, 192, 192, 0.6)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1,
            },
        ],
    };

    const gas = {
        labels: ['V1', 'V2'],
        datasets: [
            {
                label: 'Gas Used',
                data: gasUsed,
                backgroundColor: 'rgba(75, 192, 192, 0.6)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1,
            },
        ],
    };

    const time = {
        labels: ['V1', 'V2'],
        datasets: [
            {
                label: 'TIme Taken',
                data: timetaken,
                backgroundColor: 'rgba(75, 192, 192, 0.6)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1,
            },
        ],
    };
    const options = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: true,
                text: 'Sales Data',
            },
        },
    };
    return (
        <>
            {
                timetaken?.length == 2 ? <Bar data={time} options={options} /> : ""
            }
            {
                blocksize?.length == 2 ? <Bar data={size} options={options} /> : ""
            }
            {
                gasUsed?.length == 2 ? <Bar data={gas} options={options} /> : ""
            }
        </>
    )
}

export default Charts