const ItemDonation = require("../../models/ItemDonation");
const Item = require("../../models/Item");
const { createAlert } = require("../alert/alert.controller");

const getAllItemDonations = async (req, res) => {
  try {
    const { page = 1, limit = 10, category, priority, status, search, sort, activeTab } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Determine target model and base filtering
    const isDonationTab = activeTab === 'item_donations';
    const Model = isDonationTab ? ItemDonation : Item;

    let where = {};
    let sortOption = { createdAt: -1 }; // Default: desc

    // Handle Category specific tabs (Base Context)
    if (activeTab === 'ppe_kits') where.category = 'PPE Kits';
    if (activeTab === 'diagnostics') where.category = 'Diagnostic Tools';
    if (activeTab === 'supplies') where.category = 'Medical Supplies';

    // Sorting logic
    if (sort === 'oldest') sortOption = { createdAt: 1 };
    else if (sort === 'qty_desc') sortOption = { quantity: -1 };
    else if (sort === 'qty_asc') sortOption = { quantity: 1 };
    else if (sort === 'newest') sortOption = { createdAt: -1 };

    // Base filters (Filter Bar Overrides)
    if (category && category.trim() !== '' && category.toLowerCase() !== 'category') {
      where.category = category;
    }
    if (priority && priority.trim() !== '' && priority.toLowerCase() !== 'priority') {
      where.priority = priority.toUpperCase();
    }
    if (status && status.trim() !== '' && status.toLowerCase() !== 'status') {
      where.status = status.toUpperCase();
    }

    // Aggressive Text Search
    if (search && typeof search === 'string' && search.trim() !== '') {
      const q = search.trim();
      const searchRegex = { $regex: q, $options: 'i' };
      
      where.$or = [
        { itemName: searchRegex },
        { description: searchRegex }
      ];
    }

    console.log(`🔍 [LEDGER SEARCH] Model: ${isDonationTab ? 'ItemDonation' : 'Item'} | Tab: ${activeTab}`);
    console.log(`🔍 [QUERY]:`, JSON.stringify(where, null, 2));

    const [items, total] = await Promise.all([
      Model.find(where)
        .sort(sortOption)
        .skip(skip)
        .limit(parseInt(limit))
        .populate('donor'),
      Model.countDocuments(where)
    ]);

    res.json({
      items,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error("Error fetching items:", error);
    res.status(500).json({ message: "Error fetching items" });
  }
};

const createItemDonation = async (req, res) => {
  try {
    const {
      itemName,
      quantity,
      category,
      donorId,
      priority,
      description,
      imageUrl
    } = req.body;

    const newItem = await Item.create({
      itemName,
      quantity: String(quantity),
      category,
      donorId,
      priority: priority || "MEDIUM",
      description,
      imageUrl,
      status: "PENDING"
    });

    // TRIGGER ALERT: Asset Success (Always trigger on creation)
    await createAlert({
      type: "SUCCESS",
      title: "New Asset Curated",
      message: `"${itemName}" (${quantity} units) has been successfully recorded in the stewardship ledger.`,
      category: "INVENTORY"
    });

    res.status(201).json(newItem);
  } catch (error) {
    console.error("Error creating item:", error);
    res.status(500).json({ message: "Error creating item" });
  }
};

const updateItemDonation = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      itemName,
      quantity,
      category,
      priority,
      description,
      imageUrl,
      status
    } = req.body;

    const updatedItem = await Item.findByIdAndUpdate(
      id,
      {
        itemName,
        quantity: quantity ? String(quantity) : undefined,
        category,
        priority,
        description,
        imageUrl,
        status
      },
      { new: true }
    );

    if (!updatedItem) {
        return res.status(404).json({ message: "Item not found" });
    }

    // TRIGGER ALERT: Low Stock Warning (Only on update if below threshold)
    if (quantity && parseInt(quantity) < 5) {
      await createAlert({
        type: "CRITICAL",
        title: "Critical Stock Depletion",
        message: `Asset "${updatedItem.itemName}" has fallen below the safety threshold (${quantity} units remaining).`,
        category: "INVENTORY"
      });
    }

    res.json(updatedItem);
  } catch (error) {
    console.error("Error updating item:", error);
    res.status(500).json({ message: "Error updating item" });
  }
};

const deleteItemDonation = async (req, res) => {
  try {
    const { id } = req.params;
    await Item.findByIdAndDelete(id);
    res.json({ message: "Item deleted successfully" });
  } catch (error) {
    console.error("Error deleting item:", error);
    res.status(500).json({ message: "Error deleting item" });
  }
};

const getDashboardStats = async (req, res) => {
  try {
    const [totalItems, allItems, lowStockItems, categoryStats, recentlyCataloged] = await Promise.all([
      Item.countDocuments(),
      Item.find({}, { quantity: 1 }),
      Item.countDocuments({
        $or: [
          { quantity: { $lt: "5" } },
          { priority: "CRITICAL" }
        ]
      }),
      Item.aggregate([
        {
          $group: {
            _id: "$category",
            count: { $sum: 1 }
          }
        }
      ]),
      Item.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('donor')
    ]);

    // Calculate total quantity accurately by parsing strings
    const totalQty = allItems.reduce((sum, item) => sum + (parseInt(item.quantity) || 0), 0);

    // Format category distribution for charts
    const distribution = categoryStats.map(stat => ({
      name: stat._id || 'Uncategorized',
      count: stat.count,
      percentage: totalItems > 0 ? Math.round((stat.count / totalItems) * 100) : 0
    }));

    res.json({
      totalManagedItems: totalItems,
      totalQuantity: totalQty,
      lowStockAlerts: lowStockItems,
      distribution,
      recentItems: recentlyCataloged
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({ message: "Error fetching dashboard stats" });
  }
};

const getAvailableItemNames = async (req, res) => {
  try {
    const items = await Item.distinct('itemName');
    res.json(items);
  } catch (error) {
    console.error("Error fetching available item names:", error);
    res.status(500).json({ message: "Error fetching available item names" });
  }
};

module.exports = {
  getAllItemDonations,
  createItemDonation,
  updateItemDonation,
  deleteItemDonation,
  getDashboardStats,
  getAvailableItemNames
};
