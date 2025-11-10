import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, Eye, Heart, MessageSquare, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

interface Analytics {
  id: string;
  script_id: string;
  views: number;
  likes: number;
  comments: number;
  platform: string;
  published_at: string | null;
}

export const AnalyticsDashboard = () => {
  const [analytics, setAnalytics] = useState<Analytics[]>([]);
  const [timeRange, setTimeRange] = useState("30");
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - parseInt(timeRange));

      const { data, error } = await supabase
        .from('script_analytics')
        .select('*')
        .gte('created_at', daysAgo.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAnalytics(data || []);
    } catch (error) {
      toast({
        title: "Failed to load analytics",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const totalViews = analytics.reduce((sum, a) => sum + a.views, 0);
  const totalLikes = analytics.reduce((sum, a) => sum + a.likes, 0);
  const totalComments = analytics.reduce((sum, a) => sum + a.comments, 0);

  const platformData = analytics.reduce((acc: any[], curr) => {
    const existing = acc.find(item => item.name === curr.platform);
    if (existing) {
      existing.value += curr.views;
    } else {
      acc.push({ name: curr.platform || 'Unknown', value: curr.views });
    }
    return acc;
  }, []);

  const topScripts = analytics
    .sort((a, b) => (b.views + b.likes) - (a.views + a.likes))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[180px]">
            <Calendar className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
            <SelectItem value="365">All time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="glass-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Views</p>
              <p className="text-3xl font-bold">{totalViews}</p>
            </div>
            <Eye className="w-8 h-8 text-primary opacity-50" />
          </div>
        </Card>

        <Card className="glass-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Likes</p>
              <p className="text-3xl font-bold">{totalLikes}</p>
            </div>
            <Heart className="w-8 h-8 text-primary opacity-50" />
          </div>
        </Card>

        <Card className="glass-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Comments</p>
              <p className="text-3xl font-bold">{totalComments}</p>
            </div>
            <MessageSquare className="w-8 h-8 text-primary opacity-50" />
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="glass-card p-6">
          <h3 className="text-lg font-semibold mb-4">Top Performing Scripts</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topScripts}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="platform" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="views" fill="hsl(var(--primary))" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="glass-card p-6">
          <h3 className="text-lg font-semibold mb-4">Platform Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={platformData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => entry.name}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {platformData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Insights Summary */}
      {analytics.length > 0 && (
        <Card className="glass-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold">Insights Summary</h3>
          </div>
          <div className="space-y-2 text-sm">
            <p>• Most popular platform: <span className="font-semibold">{platformData[0]?.name || 'N/A'}</span></p>
            <p>• Average views per script: <span className="font-semibold">{Math.round(totalViews / analytics.length)}</span></p>
            <p>• Engagement rate: <span className="font-semibold">{((totalLikes + totalComments) / totalViews * 100).toFixed(1)}%</span></p>
          </div>
        </Card>
      )}

      {analytics.length === 0 && !isLoading && (
        <Card className="glass-card p-12 text-center">
          <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-semibold mb-2">No Analytics Yet</h3>
          <p className="text-muted-foreground">
            Start publishing your scripts and track their performance here.
          </p>
        </Card>
      )}
    </div>
  );
};
