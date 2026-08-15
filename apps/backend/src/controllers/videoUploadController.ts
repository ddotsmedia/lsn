// Video upload controller disabled - not needed for admin login
export const uploadToCloudinary = async (req: any, res: any) => {
  res.status(501).json({ error: 'Video upload not available' });
};
