"use client"

import { useEffect, useState, useMemo } from 'react';
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Legend,
  Tooltip,
  Title
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Legend, Tooltip, Title);


export default function CountryGenerationChart({ countries }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!countries || countries.length === 0) {
      setData(null);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    
    const params = new URLSearchParams();
    params.append('countries', countries.join(','));
    
    console.log('Fetching generation data for countries:', countries);
    
    fetch(`/api/generation?${params.toString()}`, { cache: 'no-store' })
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then(responseData => {
        console.log('Received generation data:', responseData);
        setData(responseData);
      })
      .catch(err => {
        console.error('Failed to load generation data', err);
        setError(err.message);
        setData(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [countries]);

  // Refresh when editor updates data
  useEffect(() => {
    const handler = () => {
      if (!countries || countries.length === 0) return;
      const params = new URLSearchParams();
      params.append('countries', countries.join(','));
      setLoading(true);
      fetch(`/api/generation?${params.toString()}`, { cache: 'no-store' })
        .then(r => r.json())
        .then(setData)
        .catch((e) => setError(e.message))
        .finally(() => setLoading(false));
    };
    window.addEventListener('country-data-updated', handler);
    return () => window.removeEventListener('country-data-updated', handler);
  }, [countries]);

  const chartData = useMemo(() => {
    if (!data || Object.keys(data).length === 0) {
      return null;
    }

    const yearSet = new Set();
    Object.values(data).forEach(countryData => {
      Object.entries(countryData).forEach(([year, value]) => {
        if (value !== null && value > 0) {
          yearSet.add(year);
        }
      });
    });
    const years = Array.from(yearSet).sort((a, b) => a - b);

    const hasValidData = years.length > 0;

    if (!hasValidData) {
      return 'no-data';
    }

    const colors = [
      { border: '#3d4a5d', background: '#3d4a5d20', point: '#3d4a5d' }, // Dark blue
      { border: '#4d7c0f', background: '#4d7c0f20', point: '#4d7c0f' }, // Green
      { border: '#dc2626', background: '#dc262620', point: '#dc2626' }, // Red
      { border: '#ea580c', background: '#ea580c20', point: '#ea580c' }, // Orange
      { border: '#7c3aed', background: '#7c3aed20', point: '#7c3aed' }  // Purple
    ];
    
    const datasets = Object.entries(data).map(([country, gen], i) => ({
      label: country,
      data: years.map(y => {
        const value = gen[y];
        return value !== null && value > 0 ? value : null;
      }),
      borderColor: colors[i % colors.length].border,
      backgroundColor: colors[i % colors.length].background,
      borderWidth: 3,
      tension: 0.3,
      pointRadius: 5,
      pointHoverRadius: 8,
      pointBackgroundColor: colors[i % colors.length].point,
      pointBorderColor: '#ffffff',
      pointBorderWidth: 2,
      fill: false,
      pointStyle: 'circle'
    }));

    return {
      labels: years,
      datasets
    };
  }, [data]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#3d4a5d]"></div>
          <div className="text-sm text-gray-600">Loading generation data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-sm text-red-500">Error loading data: {error}</div>
      </div>
    );
  }

  if (!chartData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-sm text-gray-500">Select up to 5 countries to view generation data.</div>
        </div>
      </div>
    );
  }

  if (chartData === 'no-data') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-sm text-gray-500">No generation data available for the selected countries.</div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="w-full" style={{ height: 400 }}>
      <Line
        data={chartData}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          animation: {
            duration: 1000,
            easing: 'easeInOutQuart'
          },
          plugins: {
            title: { 
              display: true, 
              text: 'Annual Electricity Generation (GWh)',
              font: { size: 18, weight: 'bold' },
              color: '#374151',
              padding: { top: 10, bottom: 20 }
            },
            legend: { 
              position: 'bottom',
              labels: {
                usePointStyle: true,
                padding: 20,
                font: { size: 12, weight: '500' },
              }
            },
            tooltip: {
              mode: 'index',
              intersect: false,
              backgroundColor: 'rgba(0, 0, 0, 0.9)',
              titleColor: '#ffffff',
              bodyColor: '#ffffff',
              borderColor: '#374151',
              borderWidth: 1,
              cornerRadius: 12,
              displayColors: true,
              padding: 12,
              callbacks: {
                title: (context) => {
                  return `Year: ${context[0].label}`;
                },
                label: function(context) {
                  const label = context.dataset.label || '';
                  const value = context.parsed.y;
                  if (value === null || value === undefined) {
                    return `${label}: No data`;
                  }
                  return `${label}: ${value.toLocaleString()} GWh`;
                }
              }
            }
          },
          scales: { 
            y: { 
              beginAtZero: true,
              title: {
                display: true,
                text: 'Generation (GWh)',
                font: { size: 14, weight: 'bold' },
                color: '#374151',
                padding: { top: 10, bottom: 10 }
              },
              grid: {
                color: 'rgba(0, 0, 0, 0.08)',
                drawBorder: false,
                lineWidth: 1
              },
              ticks: {
                color: '#6b7280',
                font: { size: 11 },
                callback: function(value) {
                  return value.toLocaleString();
                },
                padding: 8
              }
            },
            x: {
              title: {
                display: true,
                text: 'Year',
                font: { size: 14, weight: 'bold' },
                color: '#374151',
                padding: { top: 10, bottom: 10 }
              },
              grid: {
                color: 'rgba(0, 0, 0, 0.08)',
                drawBorder: false,
                lineWidth: 1
              },
              ticks: {
                color: '#6b7280',
                font: { size: 11 },
                padding: 8
              }
            }
          },
          interaction: {
            mode: 'nearest',
            axis: 'x',
            intersect: false
          },
          elements: {
            point: {
              hoverBackgroundColor: '#ffffff',
              hoverBorderColor: '#374151',
              hoverBorderWidth: 3,
              radius: 5
            },
            line: {
              borderWidth: 3
            }
          },
          layout: {
            padding: {
              top: 20,
              bottom: 20
            }
          }
        }}
      />
    </div>
  );
}