const Notification = require("../../models/Notification");

// Internal helper: create a broadcast notification for all donors
const createDonorNotification = async ({ type, title, message }) => {
    try {
        return await Notification.create({ type, title, message, userId: null });
    } catch (error) {
        console.error("Error creating donor notification:", error);
    }
};

// GET /api/notifications?userId=xxx
const getNotifications = async (req, res) => {
    try {
        const { userId } = req.query;

        // Fetch broadcast notifications (userId is null) and user-specific ones
        const query = userId
            ? { $or: [{ userId: null }, { userId }] }
            : { userId: null };

        const notifications = await Notification.find(query)
            .sort({ createdAt: -1 })
            .limit(30);

        // For broadcast notifications, mark as read if user has read them
        const result = notifications.map(n => {
            const obj = n.toJSON();
            if (!n.userId && userId) {
                // Broadcast notification: check if this user has read it
                obj.isRead = n.readBy.some(id => id.toString() === userId);
            }
            return obj;
        });

        res.json(result);
    } catch (error) {
        console.error("Error fetching notifications:", error);
        res.status(500).json({ message: "Error fetching notifications" });
    }
};

// PUT /api/notifications/:id/read?userId=xxx
const markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req.query;

        const notification = await Notification.findById(id);
        if (!notification) {
            return res.status(404).json({ message: "Notification not found" });
        }

        if (!notification.userId) {
            // Broadcast notification: add userId to readBy array
            if (userId && !notification.readBy.includes(userId)) {
                notification.readBy.push(userId);
                await notification.save();
            }
        } else {
            // User-specific notification
            notification.isRead = true;
            await notification.save();
        }

        res.json({ message: "Notification marked as read" });
    } catch (error) {
        console.error("Error marking notification as read:", error);
        res.status(500).json({ message: "Error marking notification as read" });
    }
};

// PUT /api/notifications/read-all?userId=xxx
const markAllAsRead = async (req, res) => {
    try {
        const { userId } = req.query;

        if (userId) {
            // Mark user-specific notifications as read
            await Notification.updateMany(
                { userId, isRead: false },
                { isRead: true }
            );

            // Add userId to readBy for all broadcast notifications
            const broadcasts = await Notification.find({
                userId: null,
                readBy: { $ne: userId }
            });

            for (const n of broadcasts) {
                n.readBy.push(userId);
                await n.save();
            }
        }

        res.json({ message: "All notifications marked as read" });
    } catch (error) {
        console.error("Error marking all notifications as read:", error);
        res.status(500).json({ message: "Error marking all notifications as read" });
    }
};

module.exports = {
    getNotifications,
    markAsRead,
    markAllAsRead,
    createDonorNotification
};
