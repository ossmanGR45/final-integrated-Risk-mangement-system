namespace QM.DataAccess.Repo
{
    public class Pagger
    {
        public int PageSize { get; set; } = -1;

        public int PageIndex { get; set; } = -1;

        public int TotalRecords { get; set; } = -1;

        public int TotalPages => (PageSize > 0 && TotalRecords >= 0)
            ? (int)System.Math.Ceiling((double)TotalRecords / PageSize)
            : -1;
    }
}