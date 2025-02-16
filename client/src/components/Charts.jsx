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
    console.log(gasUsed, timetaken, blocksize, transactionFee)
    const size = {
        labels: ['Merkle Tree Contract', 'Ordinary Contract', 'zkEvm Contract'],
        datasets: [
            {
                label: 'Block Size',
                data: blocksize,
                backgroundColor: 'rgb(255, 182, 193)',
            },
        ],
    };

    const gas = {
        labels: ['Merkle Tree Contract', 'Ordinary Contract', 'zkEvm Contract'],
        datasets: [
            {
                label: 'Gas Used',
                data: gasUsed,
                backgroundColor: 'rgb(173, 216, 230)',
            },
        ],
    };

    const time = {
        labels: ['Merkle Tree Contract', 'Ordinary Contract', 'zkEvm Contract'],
        datasets: [
            {
                label: 'Time Taken',
                data: timetaken,
                backgroundColor: 'rgb(144, 238, 144)',
            },
        ],
    };
    const fee = {
        labels: ['Merkle Tree Contract', 'Ordinary Contract', 'zkEvm Contract'],
        datasets: [
            {
                label: 'Transaction Fee',
                data: transactionFee,
                backgroundColor: 'rgb(216, 191, 216)',
            },
        ],
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
                font: {
                    size: 20,
                    weight: 'bold',
                },
            },
        },
        scales: {
            x: {
                title: {
                    display: true,
                    text: 'Contract Type',
                    font: {
                        size: 16,
                        weight: 'bold',
                    },
                },
            },
            y: {
                title: {
                    display: true,
                    text: 'Block Size (in Bytes)',
                    font: {
                        size: 16,
                        weight: 'bold',
                    },
                },
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
                font: {
                    size: 20,
                    weight: 'bold',
                },
            },
        },
        scales: {
            x: {
                title: {
                    display: true,
                    text: 'Contract Type',
                    font: {
                        size: 16,
                        weight: 'bold',
                    },
                },
            },
            y: {
                title: {
                    display: true,
                    text: 'Gas Used',
                    font: {
                        size: 16,
                        weight: 'bold',
                    },
                },
            },
        },
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
                text: 'Time Taken',
                font: {
                    size: 20,
                    weight: 'bold',
                },
            },
        },
        scales: {
            x: {
                title: {
                    display: true,
                    text: 'Contract Type',
                    font: {
                        size: 16,
                        weight: 'bold',
                    },
                },
            },
            y: {
                title: {
                    display: true,
                    text: 'Time Taken (in Ms)',
                    font: {
                        size: 16,
                        weight: 'bold',
                    },
                },
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
                font: {
                    size: 20,
                    weight: 'bold',
                },
            },
        },
        scales: {
            x: {
                title: {
                    display: true,
                    text: 'Contract Type',
                    font: {
                        size: 16,
                        weight: 'bold',
                    },
                },
            },
            y: {
                title: {
                    display: true,
                    text: 'Transaction Fee (in Wei)',
                    font: {
                        size: 16,
                        weight: 'bold',
                    },
                },
            },
        },
    };



    return (

        <div style={{ display: 'flex', flexDirection: 'column', gap: '100px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: "80px" }}>
                {timetaken?.length === 3 && (
                    <div style={{ width: "800px", height: "800px" }}> {/* Set desired container dimensions */}
                        <Bar data={time} options={timeOptions} />
                    </div>
                )}
                {blocksize?.length === 3 && (
                    <div style={{ width: "800px", height: "800px" }}>
                        <Bar data={size} options={sizeOptions} />
                    </div>
                )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: "80px" }}>

                {gasUsed?.length === 3 && (
                    <div style={{ width: "800px", height: "800px" }}>
                        <Bar data={gas} options={gasOptions} />
                    </div>
                )}
                {transactionFee?.length === 3 && (
                    <div style={{ width: "800px", height: "800px" }}>
                        <Bar data={fee} options={feeOptions} />
                    </div>
                )}
            </div>
        </div>
    );

}
export default Charts