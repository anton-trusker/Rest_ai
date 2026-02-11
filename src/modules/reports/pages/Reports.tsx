import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/core/ui/tabs";
import { VarianceReport } from "../components/VarianceReport";
import { StockValueReport } from "../components/StockValueReport";
import { PageHeader } from "@/core/ui/page-header";
import { Button } from "@/core/ui/button";
import { Download } from "lucide-react";
import { useState } from "react";
// import { exportToCSV } from "../utils/export"; // To be implemented

export default function Reports() {
    const [activeTab, setActiveTab] = useState("variance");

    const handleExport = () => {
        // Logic to export current tab data
        console.log("Exporting data for:", activeTab);
        // exportToCSV(activeTab);
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="Inventory Reports"
                description="Analyze inventory performance and value."
                actions={
                    <Button variant="outline" onClick={handleExport} disabled>
                        <Download className="mr-2 h-4 w-4" />
                        Export CSV (Coming Soon)
                    </Button>
                }
            />

            <Tabs defaultValue="variance" className="space-y-4" onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="variance">Variance Report</TabsTrigger>
                    <TabsTrigger value="value">Stock Value</TabsTrigger>
                </TabsList>
                <TabsContent value="variance" className="space-y-4">
                    <VarianceReport />
                </TabsContent>
                <TabsContent value="value" className="space-y-4">
                    <StockValueReport />
                </TabsContent>
            </Tabs>
        </div>
    );
}
