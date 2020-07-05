SELECT
  monthly_fee,
  SUM(? ?) AS amount
FROM
  (
    SELECT
      LEFT (? ?, 7) AS monthly_fee,
      username,
      total_amount
    FROM
      $ { SQL_TABEL_NAME }
    WHERE
      username = ?
  ) AS consume_summary
GROUP BY
  monthly_fee;