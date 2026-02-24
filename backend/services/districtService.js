const supabase = require('../utils/supabase');

// 获取所有县区
async function getCounties() {
  const { data, error } = await supabase
    .from('districts')
    .select('id, name')
    .eq('level', 1)
    .order('id');
  if (error) throw error;
  return data;
}

// 根据县区ID获取区域
async function getDistrictsByCounty(countyId) {
  const { data, error } = await supabase
    .from('districts')
    .select('id, name')
    .eq('parent_id', countyId)
    .eq('level', 2)
    .order('id');
  if (error) throw error;
  return data;
}

// 根据区域ID获取学校
async function getSchoolsByDistrict(districtId) {
  const { data, error } = await supabase
    .from('schools')
    .select('id, name, logo_url')
    .eq('district_id', districtId)
    .order('id');
  if (error) throw error;
  return data;
}

module.exports = {
  getCounties,
  getDistrictsByCounty,
  getSchoolsByDistrict,
};