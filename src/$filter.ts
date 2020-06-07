export class QueryBuilder {


  public static eq(to: string, value: string | number) {
    if (typeof value === "string" && !value.startsWith("'")) {
      value = `'${value}'`;
    }
    QueryBuilder.current.push(`${to} eq ${value}`);
  }

  public toString() {
    QueryBuilder.current.concat("");
  }

  private static current = [];
}




QueryBuilder.eq('a', 'b');