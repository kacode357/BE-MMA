const express = require("express");
const PackageController = require("../controllers/package.controller");
const router = express.Router();

router.post("/packages", PackageController.createPackageController);
router.post("/packages/:id/access", PackageController.checkPackageAccessController);
router.post("/packages/search", PackageController.getAllPackagesController); 
router.get("/packages/:id", PackageController.getPackageByIdController);
router.put("/packages/:id", PackageController.updatePackageController);
router.delete("/packages/:id", PackageController.softDeletePackageController);
module.exports = router;