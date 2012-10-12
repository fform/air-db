DB = (function(){

	var wrap_backtick = function(v){
		return '`' + v + '`';
	};
	var wrap_value = function(v){
		return '"' + String(v).replace(/"/ig,'\\"') + '"';
	};

	var query = function(type, value){

		this.stm_table = "";
		this.stm_where = "";
		this.stm_orderby = "";
		this.stm_limit = "";
		this.stm_vals = "";
		this.stm_type = type;

		if(type == "SELECT"){
			this.stm_start = "SELECT ";
			if(value){
				if(_.isArray(value)){
					var vlist = [];
					for(var i in value){
						vlist.push( wrap_backtick(value[i]) );
					}
					this.stm_start += vlist.join(',');
				}else{
					this.stm_start += wrap_backtick(value);
				}
				
			}else{
				this.stm_start += "*";
			}
		}else if(type == "INSERT"){
			this.stm_start = "INSERT";
			this.stm_table = " INTO " + wrap_backtick(value);
		}else if(type == "CREATE"){
			this.stm_start = value;
		}

		return this;
	};

	query.prototype.from = function(table){
		this.stm_table = " FROM " + wrap_backtick(table);
		
		return this;
	};

	query.prototype.where = function(what, oper, value){

		if(this.stm_where != ""){
			this.stm_where += " AND ";
		}else{
			this.stm_where += " WHERE ";
		}

		this.stm_where += wrap_backtick(what) + oper + wrap_value(value);
		
		return this;
	};

	query.prototype.order_by = function(what, direction){
		this.stm_orderby = "ORDER BY " + wrap_backtick(what) + " " + (direction || "");

		return this;
	}

	query.prototype.limit = function(amount){
		this.stm_limit = "LIMIT " + amount;

		return this;
	}

	query.prototype.setvals = function(insert){
		var keys = [];
		var vals = [];
		for(var i in insert){
			keys.push( wrap_backtick(i) );
			var v = ((typeof insert[i] != "number") ? wrap_value(insert[i]) : insert[i]);
			vals.push( v );
		}
		this.stm_vals = "(" + keys.join(',') + ") VALUES (" + vals.join(',') + ")";
		return this;
	}

	query.prototype.toString = function(){
		return this.stm_start + this.stm_table + this.stm_vals + this.stm_where + this.stm_orderby + this.stm_limit;
	}

	query.prototype.execute = function(success, error){
		
		var s = success || function(){};
		var e = error || function(){};
		query_stack.push([this, s, e]);
		db.process_stack();
		return this;
	}

	var result = function(query, success, error){

		var this._query = query;

		var success = success || function(){};
		var error = error || function(){};

		var sqlStmt = new air.SQLStatement();
		sqlStmt.sqlConnection = db_link;
		sqlStmt.text = query;
		sqlStmt.addEventListener(air.SQLEvent.RESULT, function(data){
			var dataset = [];
			var response = sqlStmt.getResult();
			if(response){
				switch(query.stm_type){
					case "SELECT":
						if(response.data){
							for(var i =0; i<response.data.length; i++){
								dataset.push(_({}).extend(response.data[i]));
							}
						}
						
					break;
					case "INSERT":
						dataset.push( response.lastInsertRowID, response.rowsAffected );
					break;
				};
			}else{
				dataset = null;
			}
			
			this._data = dataset;
			success(dataset);
		});
		sqlStmt.addEventListener(air.SQLErrorEvent.ERROR, function(err){
			error(err);
		});
		sqlStmt.execute();
		
		return this;
	};

	result.prototype.toString = function(){
		return "Result of : " + this._query + " " + JSON.stringify(this._data);
	}

	var db_link = null;
	var query_stack = [];

	var db = {

		connect: function(file, resetDB){
			db_link = new air.SQLConnection();
			db_link.addEventListener(air.SQLEvent.OPEN, function(c){
				db.process_stack();
			});
			db_link.addEventListener(air.SQLErrorEvent.ERROR, function(e){
				/* Handle Connection Error */
			});
						
			if(file.exists && resetDB){
				file.deleteFile();
			}
			db_link.openAsync( file );
		},

		select: function(sel){
			return new query('SELECT',sel);
		},

		insert: function(table){
			return new query('INSERT', table);
		},

		create: function(table, columns){

			var clines = [];
			for(var i in columns){
				clines.push( wrap_value(i) + ' ' + columns[i] );
			}
			var sql = "CREATE TABLE " + wrap_value(table) + " (" + clines.join(',') + ")";

			return new query('CREATE', sql);
		},

		execute_query: function(query, success, error){
			if(db_link){
				var inner_success = success;
				var inner_error = error;
				var s_wrap = function(d){
					inner_success(d);
					db.process_stack();
				};
				var e_wrap = function(e){
					inner_error(e);
					db.process_stack();
				};

				var r =  new result(query, s_wrap, e_wrap);
				
				return true;
			}else{
				return false;
			}
			
		},

		process_stack: function(){
			if(db_link !== null && query_stack.length > 0){
				var q = query_stack.shift();
				
				db.execute_query(q[0], q[1], q[2]);
			}
		}
	};

	return db;
})();
