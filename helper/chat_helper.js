
var ChatHelpoer = module.exports

ChatHelpoer.huruf_tebal = (msg) => {
  return "*"+msg+"*"
}

ChatHelpoer.huruf_miring = (msg) => {
  return "_" + msg + "_"
}

ChatHelpoer.huruf_font = (msg) => {
  return "\`\`\`" + msg + "\`\`\`"
}