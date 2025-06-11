const isAdmin = async (req, res, next) => {
    try {
        // Проверяем, есть ли пользователь и является ли он админом
        if (req.user && req.user.role === 'admin') {
            next();
        } else {
            res.status(403).json({ 
                message: 'Access denied. Admin rights required.' 
            });
        }
    } catch (error) {
        console.error('Admin middleware error:', error);
        res.status(500).json({ 
            message: 'Server error in admin middleware' 
        });
    }
};

export { isAdmin }; 