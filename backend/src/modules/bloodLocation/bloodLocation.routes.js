const express = require('express');
const router = express.Router();
const bloodLocationController = require('./bloodLocation.controller');

router.get('/', bloodLocationController.getLocations);
router.post('/', bloodLocationController.createLocation);
router.put('/:id', bloodLocationController.updateLocation);
router.delete('/:id', bloodLocationController.deleteLocation);

module.exports = router;
