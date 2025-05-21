const express = require("express");
const PackageController = require("../controllers/package.controller");
const router = express.Router();

router.post("/packages", PackageController.createPackageController);
router.get("/packages/:id/access", PackageController.checkPackageAccessController);
router.post("/packages/search", PackageController.getAllPackagesController); // Thêm route mới

module.exports = router;