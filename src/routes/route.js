const express = require('express');
const router = express.Router();
const urlController = require('../controllers/urlController');


router.post('/url/shorten', urlController.createShortUrl)
router.get('/:urlCode', urlController.getUrlByParams)

router.all("/*",(req,res)=>{
    return res.status(404).send({status:false,msg:" Please provide a correct end point "})
})

module.exports = router