

const getHomepage = async (req, res) => {
    return res.render('sample.ejs')
}
const getLoginpage = async (req, res) => {
    return res.render('login.ejs')
}
module.exports = {
    getHomepage,getLoginpage
}