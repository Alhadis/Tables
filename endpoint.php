<?php
	header('Content-Type: application/json; charset=UTF-8');
	error_reporting(E_ALL ^ E_NOTICE);
	
	# Connect to local database
	$link = new MySQLI('localhost', 'root', 'root', 'labs');
	$link->set_charset('utf8');
	
	
	# Configuration
	$table  = 'entrants';
	$offset = intval($_GET['offset']) ?: 0;
	$length = intval($_GET['length']) ?: 100;
	$column = max(1, intval($_GET['column']));
	$order  = boolval($_GET['desc']) ? 'DESC' : 'ASC';
	
	# Count how many rows are in the database altogether
	$count = $link->query("SELECT COUNT(1) FROM $table") OR die("Could not count rows of table \"$table\".");
	$count = intval(current($count->fetch_array()));
	
	
	# Now fetch only the queried range
	$query = $link->query("SELECT * FROM $table ORDER BY $column $order LIMIT $offset, $length");
	$data  = array();
	while($row = $query->fetch_assoc()){
		$row['ID'] = intval($row['ID']);
		$data[]    = $row;
	}

	
	# Send the compiled results to the buffer stream
	echo json_encode(array(
		'total' => $count,
		'data'  => $data
	));
