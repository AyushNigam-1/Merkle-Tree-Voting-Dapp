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
const Charts = ({ gasUsed, timetaken, blocksize, transactionFee }) => {
    const size = {
        labels: ['Merkle Tree Contract', 'Ordinary Contract'],
        datasets: [
            {
                label: 'Block Size',
                data: blocksize,
                backgroundColor: 'rgb(255, 182, 193)',
            },
        ],
    };

    const gas = {
        labels: ['Merkle Tree Contract', 'Ordinary Contract'],
        datasets: [
            {
                label: 'Gas Used',
                data: gasUsed,
                backgroundColor: 'rgb(173, 216, 230)',
            },
        ],
    };

    const time = {
        labels: ['Merkle Tree Contract', 'Ordinary Contract'],
        datasets: [
            {
                label: 'Time Taken',
                data: timetaken,
                backgroundColor: 'rgb(144, 238, 144)',
            },
        ],
    };
    const fee = {
        labels: ['Merkle Tree Contract', 'Ordinary Contract'],
        datasets: [
            {
                label: 'Transaction Fee',
                data: timetaken,
                backgroundColor: 'rgb(216, 191, 216)',
            },
        ],
    };
    const timeOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: true,
                text: 'Time Taken in ms',
            },
        },
    };
    const sizeOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: true,
                text: 'Block Size',
            },
        },
    };
    const gasOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: true,
                text: 'Gas Used',
            },
        },
    };
    const feeOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: true,
                text: 'Transaction Fee',
            },
        },
    };
    return (

        <>

            <div style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: "80px" }}>
                {timetaken?.length === 2 && (
                    <div style={{ width: "800px", height: "800px" }}> {/* Set desired container dimensions */}
                        <Bar data={time} options={timeOptions} />
                    </div>
                )}
                {blocksize?.length === 2 && (
                    <div style={{ width: "800px", height: "800px" }}>
                        <Bar data={size} options={sizeOptions} />
                    </div>
                )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: "80px" }}>

                {gasUsed?.length === 2 && (
                    <div style={{ width: "800px", height: "800px" }}>
                        <Bar data={gas} options={gasOptions} />
                    </div>
                )}
                {transactionFee?.length === 2 && (
                    <div style={{ width: "800px", height: "800px" }}>
                        <Bar data={fee} options={feeOptions} />
                    </div>
                )}
            </div>
        </>
    );

}
export default Charts