const supabase = require('../config/supabase');

class Analytics {
  async trackSummaryCreation(userId, sourceType) {
    try {
      await supabase
        .from('analytics')
        .insert([
          {
            user_id: userId,
            event_type: 'summary_created',
            source_type: sourceType,
            timestamp: new Date().toISOString()
          }
        ]);
    } catch (error) {
      console.error('Analytics tracking error:', error);
    }
  }

  async trackSummaryView(summaryId, userId) {
    try {
      await supabase
        .from('analytics')
        .insert([
          {
            user_id: userId,
            summary_id: summaryId,
            event_type: 'summary_viewed',
            timestamp: new Date().toISOString()
          }
        ]);
    } catch (error) {
      console.error('Analytics tracking error:', error);
    }
  }

  async getUsageStats(userId) {
    try {
      const { data, error } = await supabase
        .from('analytics')
        .select('*')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false });

      if (error) throw error;

      const stats = {
        totalSummaries: data.filter(d => d.event_type === 'summary_created').length,
        totalViews: data.filter(d => d.event_type === 'summary_viewed').length,
        sourceTypes: this.aggregateSourceTypes(data),
        recentActivity: data.slice(0, 10) // Last 10 activities
      };

      return stats;
    } catch (error) {
      console.error('Get usage stats error:', error);
      throw error;
    }
  }

  aggregateSourceTypes(data) {
    const sourceTypes = {};
    data
      .filter(d => d.event_type === 'summary_created')
      .forEach(d => {
        sourceTypes[d.source_type] = (sourceTypes[d.source_type] || 0) + 1;
      });
    return sourceTypes;
  }
}

module.exports = new Analytics(); 