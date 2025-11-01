import express from "express";
const router = express();
router.post("/signup", (req, res) => {
    res.send("signup route");
});
router.post("/signin", (req, res) => {
    res.send("signin route");
});
router.post("/logout", (req, res) => {
    res.send("logout route");
});
export default router;
//# sourceMappingURL=auth.route.js.map