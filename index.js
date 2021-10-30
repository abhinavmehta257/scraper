const PORT = 8000 || process.env.PORT
const axios = require('axios')
const cheerio = require('cheerio')
const express = require('express')
const app = express()
const bodyParser = require("body-parser");
const cors = require('cors')
app.use(cors())
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


if(typeof require !== 'undefined') XLSX = require('xlsx');

const StartURL = 'https://www.yellowpages.com/search?search_terms=restaurant&geo_location_terms=Glendale%2C+CA'

app.get('/', function (req, res) {
    res.json('This is my webscraper');
})

app.post('/results', async (req, res) => {
    let reqNumberOfListing = req.body.quantity;
    const listing = []

    axios(StartURL)
        .then(async(response) => {
            let html = response.data
            let $ = cheerio.load(html)
            let newURL = StartURL;
            console.log("while started");

            while($('li > .ajax-page',html).length && listing.length < reqNumberOfListing){
                await axios(newURL)
                    .then(newResponse=>{
                        // console.log("starting: ",newURL)
                        html = newResponse.data;
                        $ = cheerio.load(html);
                        newURL =  "https://www.yellowpages.com"+ $('.next.ajax-page',html).attr('href');
                        // console.log("url changed to: ",newURL)
                        console.log("Processing");

                        $('.result', html).each(function () { //<-- cannot be a function expression
                            
                            const name = $(this).find('.business-name').text() ||null;
                            if(req.body.years_in_business){
                                var years_in_business = $(this).find('.years-in-business').find('.count').text() ||null;
                            }
                            if(req.body.ypURL){
                                var ypURL = "https://www.yellowpages.com"+$(this).find('.business-name').attr('href') ||null;
                            }
                            if(req.body.phone){
                                var phone = $(this).find('.phone').text() ||null;
                            }
                            if(req.body.website){
                                var website = $(this).find('.track-visit-website').attr('href') ||null;
                            }
                            if(req.body.address){
                                var address = `${$(this).find('.street-address').text()} ${$(this).find('.locality').text()}` ||null
                            }
                            if(req.body.categories){ 
                                var categories='';
                                $(this).find('.categories').find('a').each(function(){
                                                                                // categories.push($(this).text());
                                                                                categories+=$(this).text()+",";
                                                                            });
                            }
                            if(listing.length <reqNumberOfListing){
                                listing.push({
                                    name,
                                    address,
                                    phone,
                                    categories,
                                    website,
                                    ypURL,
                                    years_in_business,
                                    // url
                                    
                                })
                            }
                            
                        });

                    }).then(()=>{
                        // console.log(listing.length);

                    }).catch(err => console.log(err))
                    
            }
            // console.log(listing);
            ws_name = "newSheet"
            var wb = XLSX.utils.book_new();
            var ws = XLSX.utils.json_to_sheet(listing);
            XLSX.utils.book_append_sheet(wb, ws, ws_name);
            XLSX.writeFile(wb, 'out.xlsb');
            
        }).then(()=>{
            res.json(listing);
        }).catch(err => console.log(err))
        

})


app.listen(PORT, () => console.log(`server running on PORT ${PORT}`))

