# AIR-DB #

_By Will Froelich_

---

This is a query writer and result runner for Adobe AIR on HTML using SQLite

---

##Usage##

Include

	<script type="text/javascript" src="db.js"></script>

Give it a file object for your DB

	var dbFile = air.File.applicationStorageDirectory.resolvePath("DBSample.db");
	DB.connect(dbFile, true); // Second parameter will force destroy the database first

Make a table

	DB.create('my_table', {
		'id':'INTEGER PRIMARY KEY',
		'name': 'TEXT',
		'occupation': 'TEXT'
	}).execute();

Insert some data

	DB.insert('my_table').setvals({
		'id': 1,
		'name': "Joey Joe jo",
		'occupation': "Drinker"
	}).execute(function(result){
		
		// result[0] : Insert ID
		// result[1] : Rows Affected

		air.trace("Inserted at row: " + result[0])
	});

Select some data

	DB.select().from('my_table').execute(function(result){
		for(var i in result){
			var row = result[i];
			air.trace( row.id, row.name, row.occupation);
		}
	});

Some more select stuff

	//Specific columns
	DB.select(['col_1','col_2'])...

	//Where
	DB.select().from('my_table').where('name','=','Joey Jo jo')...

	//Multiple conditions
	DB.select().from('my_table').where('id','>',5).where('name','=','Person')...

## License ##

	Naw bro, just be cool. I'd love to hear if you use it.

