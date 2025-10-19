import { useMemo } from 'react';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Zap9735 } from '@/types/nostr';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface ZapTimelineProps {
  zaps: Zap9735[];
}

export const ZapTimeline = ({ zaps }: ZapTimelineProps) => {
  const chartData = useMemo(() => {
    // Group zaps by hour for the last 24 hours
    const now = Date.now() / 1000;
    const hours = 24;
    const buckets: number[] = new Array(hours).fill(0);
    const labels: string[] = [];

    for (let i = hours - 1; i >= 0; i--) {
      const hourStart = now - i * 3600;
      const date = new Date(hourStart * 1000);
      labels.push(`${date.getHours()}:00`);
    }

    zaps.forEach((zap) => {
      const hoursDiff = Math.floor((now - zap.createdAt) / 3600);
      if (hoursDiff >= 0 && hoursDiff < hours) {
        const bucketIndex = hours - 1 - hoursDiff;
        buckets[bucketIndex] += zap.amountMsat / 1000; // Convert to sats
      }
    });

    return {
      labels,
      datasets: [
        {
          label: 'Zaps (sats)',
          data: buckets,
          backgroundColor: 'hsl(var(--primary))',
          borderColor: 'hsl(var(--primary-glow))',
          borderWidth: 1,
          borderRadius: 4,
        },
      ],
    };
  }, [zaps]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'hsl(var(--popover))',
        titleColor: 'hsl(var(--popover-foreground))',
        bodyColor: 'hsl(var(--popover-foreground))',
        borderColor: 'hsl(var(--border))',
        borderWidth: 1,
        callbacks: {
          label: (context: any) => `${context.parsed.y.toFixed(0)} sats`,
        },
      },
    },
    scales: {
      x: {
        grid: {
          color: 'hsl(var(--border))',
          drawBorder: false,
        },
        ticks: {
          color: 'hsl(var(--muted-foreground))',
        },
      },
      y: {
        grid: {
          color: 'hsl(var(--border))',
          drawBorder: false,
        },
        ticks: {
          color: 'hsl(var(--muted-foreground))',
        },
        beginAtZero: true,
      },
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Zap Timeline (Last 24h)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <Bar data={chartData} options={options} />
        </div>
      </CardContent>
    </Card>
  );
};
