const supabase = require('../config/supabase');

class Summary {
  static async create({ userId, url, content, summary, title, sourceType }) {
    const { data, error } = await supabase
      .from('summaries')
      .insert([
        {
          user_id: userId,
          url,
          content,
          summary,
          title,
          source_type: sourceType,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
      .select();

    if (error) throw error;
    return data[0];
  }

  static async getById(id) {
    const { data, error } = await supabase
      .from('summaries')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  static async getByUserId(userId) {
    const { data, error } = await supabase
      .from('summaries')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  static async update(id, updates) {
    const { data, error } = await supabase
      .from('summaries')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select();

    if (error) throw error;
    return data[0];
  }

  static async delete(id) {
    const { error } = await supabase
      .from('summaries')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  }
}

module.exports = Summary; 