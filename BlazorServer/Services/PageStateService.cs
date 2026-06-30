namespace BlazorServer.Services
{
    public class PageStateService
    {
        private readonly Dictionary<string, object> _pageStates = new();

        public T? GetState<T>(string pageKey) where T : class
        {
            if (_pageStates.ContainsKey(pageKey) && _pageStates[pageKey] is T state)
            {
                return state;
            }
            return null;
        }

        public void SetState(string pageKey, object state)
        {
            _pageStates[pageKey] = state;
        }

        public void ClearState(string pageKey)
        {
            if (_pageStates.ContainsKey(pageKey))
            {
                _pageStates.Remove(pageKey);
            }
        }
    }
}
