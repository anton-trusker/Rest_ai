import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/core/auth/authStore';
import { BarChart3, TrendingUp, PieChart, ArrowRight, Download } from 'lucide-react';
import { Button } from '@/core/ui/button';

export default function Reports() {
    const navigate = useNavigate();
    const { user } = useAuthStore();

    const reports = [
        {
            title: 'Current Stock Summary',
            description: 'Overview of total stock value, quantity, and distribution by region.',
            icon: PieChart,
            color: 'text-primary',
            bg: 'bg-primary/10',
        },
        {
            title: 'Inventory Trends',
            description: 'Historical analysis of stock levels and valuation over time.',
            icon: TrendingUp,
            color: 'text-accent',
            bg: 'bg-accent/10',
        },
        {
            title: 'Consumption Report',
            description: 'Depletion rates and usage statistics by wine type and location.',
            icon: BarChart3,
            color: 'text-wine-success',
            bg: 'bg-wine-success/10',
        },
    ];

    return (
        <div className="space-y-8 animate-fade-in">
            <div>
                <h1 className="text-3xl font-heading font-bold">Reports & Analytics</h1>
                <p className="text-muted-foreground mt-1">Insights into your cellar's performance</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {reports.map((report) => (
                    <div key={report.title} className="wine-glass-effect rounded-2xl p-6 hover:shadow-lg transition-all group cursor-pointer hover:-translate-y-1">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${report.bg} ${report.color}`}>
                            <report.icon className="w-6 h-6" />
                        </div>
                        <h3 className="font-heading font-semibold text-lg mb-2">{report.title}</h3>
                        <p className="text-muted-foreground text-sm mb-6 h-10">{report.description}</p>

                        <div className="flex items-center gap-3">
                            <Button variant="outline" className="flex-1 border-border group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-colors">
                                View Report
                            </Button>
                            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                                <Download className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-secondary/20 border border-border rounded-xl p-8 text-center">
                <h3 className="font-heading font-semibold text-lg mb-2">More reports coming soon</h3>
                <p className="text-muted-foreground text-sm max-w-md mx-auto mb-6">
                    Advanced analytics including variance heatmaps, supplier performance, and predictive ordering are currently under development.
                </p>
                <Button variant="outline" className="border-border">
                    Request a Custom Report
                </Button>
            </div>
        </div>
    );
}
