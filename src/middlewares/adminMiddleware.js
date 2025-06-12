const isAdmin = async (req, res, next) => {
    try {
        // Получаем список админских email из переменной окружения
        const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];
        
        // Проверяем, есть ли пользователь и является ли он админом
        if (req.user && (req.user.role === 'admin' || adminEmails.includes(req.user.email))) {
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