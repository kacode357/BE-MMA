const express = require("express");
const PackageController = require("../controllers/package.controller");
const router = express.Router();

router.post("/packages", PackageController.createPackageController);
router.get("/packages/:id/access", PackageController.checkPackageAccessController);
router.post("/packages/search", PackageController.getAllPackagesController); 
router.get("/packages/:id", PackageController.getPackageByIdController);
module.exports = router;