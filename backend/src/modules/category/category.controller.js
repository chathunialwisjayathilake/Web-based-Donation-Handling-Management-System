const Category = require("../../models/Category");

// Create Category
exports.createCategory = async (req, res) => {
  try {
    const { name, description, attributes } = req.body;

    const category = await Category.create({
        name,
        description,
        attributes: attributes || [],
        status: "Active"
    });

    res.status(201).json(category);
  } catch (error) {
    console.error("Error creating category:", error);
    if (error.code === 11000) {
      return res.status(400).json({ message: "Category name already exists" });
    }
    res.status(500).json({ message: "Failed to create category" });
  }
};

// Get All Categories
exports.getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find()
      .sort({ createdAt: -1 });
    res.json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ message: "Failed to fetch categories" });
  }
};

// Delete Category
exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    await Category.findByIdAndDelete(id);
    res.json({ message: "Category retired successfully" });
  } catch (error) {
    console.error("Error deleting category:", error);
    res.status(500).json({ message: "Failed to delete category" });
  }
};
// Update Category
exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, attributes } = req.body;

    const updatedCategory = await Category.findByIdAndUpdate(
      id,
      {
        name,
        description,
        attributes: attributes || []
      },
      { new: true }
    );

    res.json(updatedCategory);
  } catch (error) {
    console.error("Error updating category:", error);
    if (error.code === 11000) {
      return res.status(400).json({ message: "Category name already exists" });
    }
    res.status(500).json({ message: "Failed to update category" });
  }
};
